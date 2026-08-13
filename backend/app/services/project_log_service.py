from typing import List, Optional
from sqlalchemy.orm import Session
from app.models.project_log import ProjectLog
from app.models.user import User
from app.schemas.project import ProjectLogResponse


def add_log(db: Session, project_id: int, actor_id: Optional[int], action: str,
            field: Optional[str] = None, old=None, new=None) -> None:
    """로그 기록(커밋은 호출자 책임)."""
    db.add(ProjectLog(
        project_id=project_id,
        actor_user_id=actor_id,
        action=action,
        field=field,
        old_value=None if old is None else str(old),
        new_value=None if new is None else str(new),
    ))


def get_logs(db: Session, project_id: int) -> List[ProjectLogResponse]:
    logs = (
        db.query(ProjectLog)
        .filter(ProjectLog.project_id == project_id)
        .order_by(ProjectLog.created_at.desc(), ProjectLog.id.desc())
        .all()
    )
    result = []
    for lg in logs:
        actor = db.query(User).filter(User.id == lg.actor_user_id).first() if lg.actor_user_id else None
        result.append(ProjectLogResponse(
            id=lg.id,
            actor_name=actor.display_name if actor else None,
            action=lg.action,
            field=lg.field,
            old_value=lg.old_value,
            new_value=lg.new_value,
            created_at=lg.created_at,
        ))
    return result
