from typing import List
from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.user import User
from app.models.project import Project
from app.models.week import Week
from app.models.report import Report, ReportEntry
from app.schemas.week import WeekCreateRequest, WeekResponse, MemberStatusResponse, OverallSummaryResponse, ProjectSummaryItem
from app.ordering import user_sort_key


def get_weeks(db: Session) -> List[WeekResponse]:
    weeks = (
        db.query(Week)
        .filter(Week.is_deleted == False)  # noqa: E712
        .order_by(Week.year.desc(), Week.month.desc(), Week.week_num.asc())
        .all()
    )
    active_count = db.query(User).filter(User.is_active == True, User.in_weekly == True, User.role != "admin").count()
    result = []
    for w in weeks:
        done = db.query(Report).filter(Report.week_id == w.id, Report.status == "done").count()
        r = WeekResponse.model_validate(w)
        r.total_members = active_count
        r.done_members = done
        result.append(r)
    return result


def _validate_dates(req: WeekCreateRequest) -> None:
    if req.start_date and req.end_date and req.end_date < req.start_date:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST,
                            detail="종료일이 시작일보다 빠를 수 없습니다.")


def create_week(db: Session, req: WeekCreateRequest) -> WeekResponse:
    _validate_dates(req)
    existing = db.query(Week).filter(
        Week.year == req.year, Week.month == req.month, Week.week_num == req.week_num,
        Week.is_deleted == False,  # noqa: E712
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 주차입니다.")
    week = Week(year=req.year, month=req.month, week_num=req.week_num, title=req.title,
                start_date=req.start_date, end_date=req.end_date)
    db.add(week)
    db.commit()
    db.refresh(week)
    r = WeekResponse.model_validate(week)
    r.total_members = db.query(User).filter(User.is_active == True, User.in_weekly == True, User.role != "admin").count()
    r.done_members = 0
    return r


def update_week(db: Session, week_id: int, req: WeekCreateRequest) -> WeekResponse:
    week = _find(db, week_id)
    _validate_dates(req)
    dup = db.query(Week).filter(
        Week.year == req.year, Week.month == req.month, Week.week_num == req.week_num,
        Week.id != week_id, Week.is_deleted == False,  # noqa: E712
    ).first()
    if dup:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 주차입니다.")
    week.year = req.year
    week.month = req.month
    week.week_num = req.week_num
    week.title = req.title
    week.start_date = req.start_date
    week.end_date = req.end_date
    db.commit()
    db.refresh(week)
    r = WeekResponse.model_validate(week)
    r.total_members = db.query(User).filter(User.is_active == True, User.in_weekly == True, User.role != "admin").count()
    r.done_members = db.query(Report).filter(Report.week_id == week.id, Report.status == "done").count()
    return r


def delete_week(db: Session, week_id: int) -> None:
    # 소프트 삭제: 화면에서만 사라지고 주차·주간보고 데이터는 DB에 보존
    week = _find(db, week_id)
    week.is_deleted = True
    db.commit()


def get_members(db: Session, week_id: int) -> List[MemberStatusResponse]:
    _find(db, week_id)
    # 현재 참여자(활성 + 주간보고 대상) + 이 주차에 보고가 남아있는 사용자(비활성 포함, 과거 기록 열람)
    active_ids = {
        u.id for u in db.query(User).filter(User.is_active == True, User.in_weekly == True, User.role != "admin").all()  # noqa: E712
    }
    reported_ids = {r.user_id for r in db.query(Report).filter(Report.week_id == week_id).all()}
    all_ids = active_ids | reported_ids
    # 관리자는 주간보고 작성자가 아니므로 목록에서 제외
    users = db.query(User).filter(User.id.in_(all_ids), User.role != "admin").all() if all_ids else []
    users.sort(key=user_sort_key)  # 비활성은 맨 아래 → 직책 → 가나다
    result = []
    for u in users:
        report = db.query(Report).filter(Report.week_id == week_id, Report.user_id == u.id).first()
        name = u.display_name if u.is_active else f"{u.display_name} (비활성)"
        result.append(MemberStatusResponse(
            user_id=u.id,
            display_name=name,
            status=report.status if report else "none",
            sort_order=u.sort_order,
        ))
    return result


def get_summary(db: Session, week_id: int) -> OverallSummaryResponse:
    import re
    PINNED_LAST = "휴가 및 교육"

    week = _find(db, week_id)
    projects = db.query(Project).filter(Project.show_in_weekly == True).all()  # noqa: E712
    projects.sort(key=lambda p: (
        p.name == PINNED_LAST,
        not bool(re.match(r'^[A-Za-z]', p.name)),
        p.name.lower() if re.match(r'^[A-Za-z]', p.name) else p.name
    ))
    project_map = {p.id: p for p in projects}

    report_rows = (
        db.query(Report, User)
        .join(User, Report.user_id == User.id)
        .filter(Report.week_id == week_id)
        .all()
    )
    report_rows.sort(key=lambda ru: user_sort_key(ru[1]))  # 직책 순 → 이름 가나다
    reports = [r for r, _u in report_rows]
    data: dict = {}
    for report in reports:
        entries = db.query(ReportEntry).filter(ReportEntry.report_id == report.id).all()
        for entry in entries:
            if entry.project_id not in data:
                data[entry.project_id] = {"current": [], "next": []}
            if entry.current_work and entry.current_work.strip():
                data[entry.project_id]["current"].append(entry.current_work.strip())
            if entry.next_work and entry.next_work.strip():
                data[entry.project_id]["next"].append(entry.next_work.strip())

    items = []
    pinned_item = None
    for project in projects:
        is_pinned = project.name == PINNED_LAST
        d = data.get(project.id, {"current": [], "next": []})
        has_content = bool(d["current"] or d["next"])

        if not is_pinned and not has_content:
            continue

        item = ProjectSummaryItem(
            project_id=project.id,
            project_name=project.name,
            current_work=d["current"],
            next_work=d["next"],
        )
        if is_pinned:
            pinned_item = item
        else:
            items.append(item)

    if pinned_item:
        items.append(pinned_item)

    return OverallSummaryResponse(week_id=week_id, title=week.title, projects=items)


def _find(db: Session, week_id: int) -> Week:
    week = db.query(Week).filter(Week.id == week_id).first()
    if not week:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="주차를 찾을 수 없습니다.")
    return week
