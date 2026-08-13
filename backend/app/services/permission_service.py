from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.role_permission import RolePermission

# 역할 · 권한 카탈로그
ROLES = [("admin", "관리자"), ("pm", "PM"), ("member", "팀원")]
PERMISSIONS = [
    ("project.create", "프로젝트 생성"),
    ("project.edit", "프로젝트 수정"),
    ("project.delete", "프로젝트 삭제"),
    ("project.member", "팀원 배정"),
    ("week.manage", "주차 생성/수정/삭제"),
    ("meta.manage", "유형/상태 관리"),
    ("account.manage", "계정 관리"),
]
_ROLE_KEYS = {k for k, _ in ROLES}
_PERM_KEYS = {k for k, _ in PERMISSIONS}
_PM_DEFAULT = {"project.edit", "project.member"}  # PM 기본 허용


def _default(role: str, perm: str) -> bool:
    if role == "admin":
        return True
    if role == "pm":
        return perm in _PM_DEFAULT
    return False


def get_matrix(db: Session) -> dict:
    stored = {(r.role, r.permission): r.enabled for r in db.query(RolePermission).all()}
    matrix = {}
    for role_key, _ in ROLES:
        matrix[role_key] = {}
        for perm_key, _ in PERMISSIONS:
            matrix[role_key][perm_key] = stored.get((role_key, perm_key), _default(role_key, perm_key))
    return {
        "roles": [{"key": k, "label": l} for k, l in ROLES],
        "permissions": [{"key": k, "label": l} for k, l in PERMISSIONS],
        "matrix": matrix,
    }


def set_permission(db: Session, role: str, permission: str, enabled: bool) -> dict:
    if role not in _ROLE_KEYS or permission not in _PERM_KEYS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="알 수 없는 역할/권한입니다.")
    row = db.query(RolePermission).filter(
        RolePermission.role == role, RolePermission.permission == permission
    ).first()
    if row:
        row.enabled = enabled
    else:
        db.add(RolePermission(role=role, permission=permission, enabled=enabled))
    db.commit()
    return get_matrix(db)
