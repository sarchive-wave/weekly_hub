# backend.md
# AI Weekly Hub - 백엔드 명세
# FastAPI 라우터, 서비스 로직, DB 연동 정의

---

## 디렉토리 구조

```
backend/
├── app/
│   ├── main.py              # FastAPI 앱, CORS, 라우터 등록
│   ├── database.py          # SQLAlchemy 엔진/세션
│   ├── config.py            # .env 환경변수
│   ├── seed.py              # 초기 admin 계정 생성
│   ├── auth/
│   │   ├── jwt.py           # 토큰 생성/검증
│   │   └── dependencies.py  # get_current_user, require_admin
│   ├── models/
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── week.py
│   │   ├── report.py
│   │   └── report_entry.py
│   ├── schemas/
│   │   ├── auth.py
│   │   ├── user.py
│   │   ├── project.py
│   │   ├── week.py
│   │   └── report.py
│   ├── routers/
│   │   ├── auth.py
│   │   ├── users.py
│   │   ├── projects.py
│   │   ├── weeks.py
│   │   └── reports.py
│   └── services/
│       ├── auth_service.py
│       ├── user_service.py
│       ├── project_service.py
│       ├── week_service.py
│       └── report_service.py
├── data/                    # weekly_hub.db 자동 생성
├── .env
└── requirements.txt
```

---

## requirements.txt

```
fastapi
uvicorn[standard]
sqlalchemy
python-jose[cryptography]
passlib[bcrypt]
python-dotenv
pydantic[email]
```

---

## .env

```
SECRET_KEY=change-me-to-random-32-bytes
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=480
DATABASE_URL=sqlite:///./data/weekly_hub.db
CORS_ORIGINS=http://localhost:5174
```

---

## main.py 구조

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, users, projects, weeks, reports
from app.database import engine, Base
from app import seed

Base.metadata.create_all(bind=engine)
seed.run()

app = FastAPI(title="AI Weekly Hub API")
app.add_middleware(CORSMiddleware, allow_origins=[...], allow_credentials=True,
                   allow_methods=["*"], allow_headers=["*"])

app.include_router(auth.router, prefix="/api/v1/auth")
app.include_router(users.router, prefix="/api/v1/users")
app.include_router(projects.router, prefix="/api/v1/projects")
app.include_router(weeks.router, prefix="/api/v1/weeks")
app.include_router(reports.router, prefix="/api/v1/reports")
```

---

## 라우터 상세

### auth.py
```
POST /api/v1/auth/login              # LoginRequest → TokenResponse
GET  /api/v1/auth/me                 # → UserResponse
PUT  /api/v1/auth/change-password    # ChangePasswordRequest
```

### users.py (관리자 전용)
```
GET    /api/v1/users                 # → List[UserResponse]
POST   /api/v1/users                 # UserCreateRequest → UserResponse
PUT    /api/v1/users/reorder         # ReorderRequest (ids 순서) - /{id} 보다 먼저 선언
PUT    /api/v1/users/{id}            # UserUpdateRequest → UserResponse
DELETE /api/v1/users/{id}            # 204
POST   /api/v1/users/{id}/reset-password  # ResetPasswordRequest
```

### projects.py (관리자 전용)
```
GET    /api/v1/projects              # → List[ProjectResponse]
POST   /api/v1/projects              # ProjectCreateRequest → ProjectResponse
PUT    /api/v1/projects/reorder      # ReorderRequest - /{id} 보다 먼저 선언
PUT    /api/v1/projects/{id}         # ProjectUpdateRequest → ProjectResponse
DELETE /api/v1/projects/{id}         # 204
```

### weeks.py
```
GET    /api/v1/weeks                 # → List[WeekResponse] (로그인 필요)
POST   /api/v1/weeks                 # WeekCreateRequest (관리자)
DELETE /api/v1/weeks/{id}            # 204 (관리자)
GET    /api/v1/weeks/{id}/summary    # → OverallSummaryResponse (전체열람)
GET    /api/v1/weeks/{id}/members    # → List[MemberStatusResponse] (전체열람)
```

### reports.py
```
GET    /api/v1/reports/{week_id}/{user_id}         # → ReportResponse (본인/관리자)
PUT    /api/v1/reports/{week_id}/{user_id}         # ReportSaveRequest → ReportResponse
PATCH  /api/v1/reports/{week_id}/{user_id}/status  # StatusUpdateRequest
```

---

## 공통 응답 형식

```json
{
  "success": true,
  "data": { ... },
  "message": "처리되었습니다."
}
```

에러:
```json
{
  "success": false,
  "data": null,
  "message": "에러 메시지"
}
```

---

## 주요 서비스 로직

### report_service.py - get_summary(week_id)
- 해당 주차 모든 reports + entries 조회
- 프로젝트별로 current_work / next_work 취합 (작성자 이름 제외)
- 내용 없는 프로젝트 제외
- 반환: `[{ project_id, project_name, current_work: ["내용1", "내용2"], next_work: [...] }]`

### report_service.py - save_report(week_id, user_id, data)
- report 없으면 생성, 있으면 기존 entries 전부 삭제 후 재생성
- entries: 선택된 project_id별 current_work, next_work 저장
- updated_at 갱신

### week_service.py - get_members(week_id)
- users 테이블 전체 (is_active=True, sort_order 순)
- 각 유저에 해당 week_id의 report.status 조인
- report 없으면 status='none'
- 반환: `[{ user_id, display_name, status, sort_order }]`

---

## Python 3.9 호환 주의사항

- `list[T]` → `List[T]` (typing 모듈 사용)
- `T | None` → `Optional[T]`
- `dict[str, Any]` → `Dict[str, Any]`
