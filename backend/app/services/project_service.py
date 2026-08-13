from typing import List, Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.project import Project
from app.models.project_type import ProjectType
from app.models.project_status import ProjectStatus
from app.models.project_member import ProjectMember
from app.models.user import User
from app.models.week import Week
from app.models.report import Report, ReportEntry
from app.schemas.project import (
    ProjectCreateRequest, ProjectUpdateRequest, ProjectResponse,
    ProjectMemberResponse, ProjectMemberItem, ProjectWeeklyItem,
)
from app.schemas.dashboard import DashboardResponse, DashboardItem, CountItem
from app.services import project_log_service

STATUS_ACTIVE = "진행중"
STATUS_DONE = "완료"

# 감사 로그용 필드 라벨
FIELD_LABELS = {
    "name": "프로젝트명", "code": "코드", "description": "소개",
    "type_id": "유형", "status_id": "상태", "pm_user_id": "PM",
    "start_date": "시작일", "end_date": "마감예정일",
    "nas_path": "NAS 경로", "git_url": "Git 저장소",
}


# ── 조회 ────────────────────────────────────────────────────
def get_projects(db: Session, status_name: Optional[str] = None) -> List[ProjectResponse]:
    q = db.query(Project)
    if status_name:
        q = q.filter(Project.status_id == _status_id(db, status_name))
    projects = q.order_by(Project.sort_order.asc(), Project.id.asc()).all()
    return [_to_response(db, p) for p in projects]


def get_project(db: Session, project_id: int) -> ProjectResponse:
    return _to_response(db, _find(db, project_id))


def get_dashboard(db: Session) -> DashboardResponse:
    projects = db.query(Project).order_by(Project.sort_order.asc(), Project.id.asc()).all()
    statuses = {s.id: s.name for s in db.query(ProjectStatus).all()}
    types = {t.id: t.name for t in db.query(ProjectType).all()}

    status_counts: dict = {}
    type_counts: dict = {}
    items: List[DashboardItem] = []
    for p in projects:
        s_name = statuses.get(p.status_id)
        t_name = types.get(p.type_id)
        status_counts[s_name] = status_counts.get(s_name, 0) + 1
        if t_name:
            type_counts[t_name] = type_counts.get(t_name, 0) + 1
        if s_name == STATUS_ACTIVE:  # 대시보드 카드에는 진행중만 노출
            members = _member_users(db, p.id)
            items.append(DashboardItem(
                project_id=p.id, code=p.code, name=p.name,
                type_name=t_name, status_name=s_name,
                pm_name=_pm_name(db, p),
                member_count=len(members),
                member_names=[u.display_name for u in members],
                start_date=p.start_date, end_date=p.end_date,
            ))
    return DashboardResponse(
        total=len(projects),
        by_status=[CountItem(name=k or "미지정", count=v) for k, v in status_counts.items()],
        by_type=[CountItem(name=k, count=v) for k, v in type_counts.items()],
        items=items,
    )


def get_weekly(db: Session, project_id: int) -> List[ProjectWeeklyItem]:
    """프로젝트 상세용 read-only 주간 진행/계획 (주차별 취합)."""
    _find(db, project_id)
    rows = (
        db.query(Week, ReportEntry)
        .join(Report, Report.week_id == Week.id)
        .join(ReportEntry, ReportEntry.report_id == Report.id)
        .filter(ReportEntry.project_id == project_id)
        .order_by(Week.year.desc(), Week.month.desc(), Week.week_num.desc())
        .all()
    )
    bucket: dict = {}
    order: list = []
    for week, entry in rows:
        if week.id not in bucket:
            bucket[week.id] = ProjectWeeklyItem(
                week_id=week.id, title=week.title, year=week.year,
                month=week.month, week_num=week.week_num,
                current_work=[], next_work=[],
            )
            order.append(week.id)
        if entry.current_work and entry.current_work.strip():
            bucket[week.id].current_work.append(entry.current_work.strip())
        if entry.next_work and entry.next_work.strip():
            bucket[week.id].next_work.append(entry.next_work.strip())
    return [bucket[i] for i in order]


# ── 생성/수정/상태 ──────────────────────────────────────────
def create_project(db: Session, req: ProjectCreateRequest, actor_id: int) -> ProjectResponse:
    if db.query(Project).filter(Project.name == req.name).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 프로젝트명입니다.")
    if req.code and db.query(Project).filter(Project.code == req.code).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 프로젝트 코드입니다.")

    status_id = req.status_id or _status_id(db, STATUS_ACTIVE)
    project = Project(
        code=req.code or None, name=req.name, description=req.description,
        type_id=req.type_id, status_id=status_id, pm_user_id=req.pm_user_id,
        start_date=req.start_date, end_date=req.end_date,
        nas_path=req.nas_path, git_url=req.git_url,
    )
    db.add(project)
    db.flush()
    if not project.code:
        project.code = f"PRJ-{project.id:04d}"
    project_log_service.add_log(db, project.id, actor_id, "프로젝트 생성", new=project.name)
    db.commit()
    db.refresh(project)
    return _to_response(db, project)


def update_project(db: Session, project_id: int, req: ProjectUpdateRequest, actor: User) -> ProjectResponse:
    project = _find(db, project_id)
    ensure_can_edit(db, actor, project)

    # 부분 업데이트: 요청에 명시적으로 보낸 필드만 반영(누락 필드는 보존)
    provided = req.model_dump(exclude_unset=True)
    # 상태는 완료/재개 액션으로만 변경 → 일반 수정에서 제외
    provided.pop("status_id", None)

    if "name" in provided and db.query(Project).filter(Project.name == provided["name"], Project.id != project_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 프로젝트명입니다.")
    if provided.get("code") and db.query(Project).filter(Project.code == provided["code"], Project.id != project_id).first():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="이미 존재하는 프로젝트 코드입니다.")

    # 필드별 변경 감사 로그
    for field in ("name", "code", "description", "type_id",
                  "pm_user_id", "start_date", "end_date", "nas_path", "git_url"):
        if field not in provided:
            continue
        old = getattr(project, field)
        new = provided[field]
        if old != new:
            project_log_service.add_log(
                db, project.id, actor.id, f"{FIELD_LABELS[field]} 변경", field=field,
                old=_display(db, field, old), new=_display(db, field, new),
            )
            setattr(project, field, new)

    db.commit()
    db.refresh(project)
    return _to_response(db, project)


def complete_project(db: Session, project_id: int, actor: User) -> ProjectResponse:
    return _set_status(db, project_id, STATUS_DONE, "완료 처리", actor)


def reopen_project(db: Session, project_id: int, actor: User) -> ProjectResponse:
    return _set_status(db, project_id, STATUS_ACTIVE, "재개", actor)


def delete_project(db: Session, project_id: int) -> None:
    db.delete(_find(db, project_id))
    db.commit()


def reorder_projects(db: Session, ids: List[int]) -> None:
    for order, pid in enumerate(ids, start=1):
        db.query(Project).filter(Project.id == pid).update({"sort_order": order})
    db.commit()


# ── 구성원 ──────────────────────────────────────────────────
def get_members(db: Session, project_id: int) -> List[ProjectMemberResponse]:
    _find(db, project_id)
    return _member_responses(db, project_id)


def set_members(db: Session, project_id: int, members: List[ProjectMemberItem], actor: User) -> List[ProjectMemberResponse]:
    project = _find(db, project_id)
    ensure_can_edit(db, actor, project)
    before = {m.user_id for m in db.query(ProjectMember).filter(ProjectMember.project_id == project_id).all()}
    after = {m.user_id for m in members}

    db.query(ProjectMember).filter(ProjectMember.project_id == project_id).delete()
    for m in members:
        db.add(ProjectMember(project_id=project_id, user_id=m.user_id, role=m.role or "member"))

    added = after - before
    removed = before - after
    if added:
        project_log_service.add_log(db, project_id, actor.id, "팀원 추가", field="member",
                                    new=", ".join(_names(db, added)))
    if removed:
        project_log_service.add_log(db, project_id, actor.id, "팀원 제외", field="member",
                                    old=", ".join(_names(db, removed)))
    db.commit()
    return _member_responses(db, project_id)


# ── 권한 헬퍼 ───────────────────────────────────────────────
def is_project_pm(db: Session, user: User, project: Project) -> bool:
    if project.pm_user_id == user.id:
        return True
    m = (
        db.query(ProjectMember)
        .filter(ProjectMember.project_id == project.id,
                ProjectMember.user_id == user.id,
                ProjectMember.role == "pm")
        .first()
    )
    return m is not None


def ensure_can_edit(db: Session, user: User, project: Project) -> None:
    """관리자이거나 해당 프로젝트 PM만 편집 가능."""
    if user.role == "admin" or is_project_pm(db, user, project):
        return
    raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="이 프로젝트를 수정할 권한이 없습니다.")


# ── 내부 헬퍼 ───────────────────────────────────────────────
def _set_status(db: Session, project_id: int, status_name: str, action: str, actor: User) -> ProjectResponse:
    project = _find(db, project_id)
    ensure_can_edit(db, actor, project)
    new_id = _status_id(db, status_name)
    if project.status_id != new_id:
        project_log_service.add_log(db, project.id, actor.id, action, field="status_id",
                                    old=_display(db, "status_id", project.status_id),
                                    new=status_name)
        project.status_id = new_id
    db.commit()
    db.refresh(project)
    return _to_response(db, project)


def _find(db: Session, project_id: int) -> Project:
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="프로젝트를 찾을 수 없습니다.")
    return project


def _status_id(db: Session, name: str) -> Optional[int]:
    s = db.query(ProjectStatus).filter(ProjectStatus.name == name).first()
    return s.id if s else None


def _pm_name(db: Session, project: Project) -> Optional[str]:
    if not project.pm_user_id:
        return None
    u = db.query(User).filter(User.id == project.pm_user_id).first()
    return u.display_name if u else None


def _member_users(db: Session, project_id: int) -> List[User]:
    rows = (
        db.query(User)
        .join(ProjectMember, ProjectMember.user_id == User.id)
        .filter(ProjectMember.project_id == project_id)
        .order_by(User.sort_order.asc(), User.id.asc())
        .all()
    )
    return rows


def _member_responses(db: Session, project_id: int) -> List[ProjectMemberResponse]:
    rows = (
        db.query(ProjectMember, User)
        .join(User, User.id == ProjectMember.user_id)
        .filter(ProjectMember.project_id == project_id)
        .order_by(User.sort_order.asc(), User.id.asc())
        .all()
    )
    return [
        ProjectMemberResponse(
            user_id=u.id, display_name=u.display_name,
            position=u.position, team=u.team, role=m.role,
        )
        for m, u in rows
    ]


def _names(db: Session, user_ids) -> List[str]:
    users = db.query(User).filter(User.id.in_(list(user_ids))).all()
    return [u.display_name for u in users]


def _display(db: Session, field: str, value):
    """감사 로그용 사람이 읽을 값 변환 (FK는 이름으로)."""
    if value is None:
        return None
    if field == "type_id":
        t = db.query(ProjectType).filter(ProjectType.id == value).first()
        return t.name if t else str(value)
    if field == "status_id":
        s = db.query(ProjectStatus).filter(ProjectStatus.id == value).first()
        return s.name if s else str(value)
    if field == "pm_user_id":
        u = db.query(User).filter(User.id == value).first()
        return u.display_name if u else str(value)
    return str(value)


def _to_response(db: Session, project: Project) -> ProjectResponse:
    members = _member_responses(db, project.id)
    return ProjectResponse(
        id=project.id, code=project.code, name=project.name, description=project.description,
        type_id=project.type_id, type_name=(project.type.name if project.type else None),
        status_id=project.status_id, status_name=(project.status.name if project.status else None),
        pm_user_id=project.pm_user_id, pm_name=_pm_name(db, project),
        start_date=project.start_date, end_date=project.end_date,
        nas_path=project.nas_path, git_url=project.git_url,
        sort_order=project.sort_order,
        member_count=len(members), members=members,
        created_at=project.created_at, updated_at=project.updated_at,
    )
