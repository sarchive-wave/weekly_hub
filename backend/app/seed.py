from sqlalchemy.orm import Session
from app.database import SessionLocal
from app.models.user import User
from app.services.auth_service import hash_password


def run():
    db: Session = SessionLocal()
    try:
        if not db.query(User).filter(User.role == "admin").first():
            admin = User(
                username="admin",
                password_hash=hash_password("admin1234"),
                role="admin",
                display_name="관리자",
                sort_order=0,
            )
            db.add(admin)
            db.commit()
    finally:
        db.close()
