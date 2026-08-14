from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.project import Project
from app.models.report import Report, ReportEntry
from app.schemas.report import ReportSaveRequest, ReportResponse, EntryResponse


def get_report(db: Session, week_id: int, user_id: int) -> ReportResponse:
    report = db.query(Report).filter(Report.week_id == week_id, Report.user_id == user_id).first()
    if not report:
        return ReportResponse(week_id=week_id, user_id=user_id, status="none", entries=[])
    return _to_response(db, report)


def save_report(db: Session, week_id: int, user_id: int, req: ReportSaveRequest) -> ReportResponse:
    report = db.query(Report).filter(Report.week_id == week_id, Report.user_id == user_id).first()
    if not report:
        report = Report(week_id=week_id, user_id=user_id, status="draft")
        db.add(report)
        db.flush()

    db.query(ReportEntry).filter(ReportEntry.report_id == report.id).delete()

    for entry_data in req.entries:
        project = db.query(Project).filter(Project.id == entry_data.project_id).first()
        if not project:
            continue
        entry = ReportEntry(
            report_id=report.id,
            project_id=entry_data.project_id,
            project_name=project.name,   # 작성 시점 프로젝트명 스냅샷
            current_work=entry_data.current_work or "",
            next_work=entry_data.next_work or "",
        )
        db.add(entry)

    db.commit()
    db.refresh(report)
    return _to_response(db, report)


def update_status(db: Session, week_id: int, user_id: int, new_status: str) -> ReportResponse:
    if new_status not in ("none", "draft", "done"):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="유효하지 않은 상태값입니다.")
    report = db.query(Report).filter(Report.week_id == week_id, Report.user_id == user_id).first()
    if not report:
        report = Report(week_id=week_id, user_id=user_id, status=new_status)
        db.add(report)
    else:
        report.status = new_status
    db.commit()
    db.refresh(report)
    return _to_response(db, report)


def _to_response(db: Session, report: Report) -> ReportResponse:
    entries = db.query(ReportEntry).filter(ReportEntry.report_id == report.id).all()
    entry_responses = []
    for e in entries:
        project = db.query(Project).filter(Project.id == e.project_id).first() if e.project_id else None
        # 프로젝트가 남아있으면 현재명, 삭제됐으면 작성 시점 스냅샷명 사용
        name = project.name if project else (e.project_name or "")
        entry_responses.append(EntryResponse(
            project_id=e.project_id,
            project_name=name,
            current_work=e.current_work or "",
            next_work=e.next_work or "",
        ))
    return ReportResponse(
        week_id=report.week_id,
        user_id=report.user_id,
        status=report.status,
        entries=entry_responses,
    )
