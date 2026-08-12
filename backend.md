# Backend API Specification

> 데이터베이스 설계(테이블/ERD/컬럼/인덱스/관계)는 `db.md`, 인증/권한 상세는 `auth.md`에서 관리한다. 이 문서는 **API 명세만** 다룬다.

## 기술 스택

- Python 3.9 / FastAPI / Uvicorn
- SQLAlchemy 2.0 (ORM, `Column` 스타일) / Pydantic v2
- 인증: JWT(python-jose), 비밀번호 해시 bcrypt(passlib)
- PostgreSQL (psycopg2-binary)

---

## 패키지 구조

```
backend/app/
├── main.py              # FastAPI 앱, CORS, 라우터 등록, create_all, seed.run()
├── config.py            # .env 환경변수 (SECRET_KEY, DATABASE_URL, CORS_ORIGINS 등)
├── database.py          # 엔진/세션/get_db 의존성
├── seed.py              # 최초 admin 계정 생성
├── auth/
│   ├── jwt.py           # create_access_token / decode_token
│   └── dependencies.py  # get_current_user / require_admin
├── models/              # User, Project, Week, Report, ReportEntry
├── schemas/             # auth, user, project, week, report Pydantic
├── routers/             # auth, users, projects, weeks, reports
└── services/            # auth, user, project, week, report 비즈니스 로직
```

---

## 인증 & 응답 형식

- 인증 헤더: `Authorization: Bearer <access_token>` (로그인으로 발급)
- 권한 의존성: `get_current_user`(로그인 필요), `require_admin`(role == "admin")
- **응답 형식은 혼재**한다:
  - 대부분: 응답 모델을 직접 반환 (예: `UserResponse`, `WeekResponse[]`)
  - 액션형 일부(reorder / reset-password / change-password): `{ "success": true, "data": null, "message": "..." }`
- 에러: `HTTPException`으로 상태코드 + `detail` 반환

---

## Auth API — `/api/v1/auth`

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| POST | `/login` | 없음 | 로그인 → `{ access_token, token_type }` |
| GET | `/me` | 로그인 | 현재 사용자 `{ id, username, display_name, role }` |
| PUT | `/change-password` | 로그인 | 본인 비밀번호 변경 |

```jsonc
// POST /login
{ "username": "admin", "password": "admin1234" }
// → { "access_token": "<jwt>", "token_type": "bearer" }

// PUT /change-password
{ "current_password": "old", "new_password": "new123" }
```
- 로그인 실패 → `401`. 현재 비밀번호 불일치/새 비밀번호 6자 미만 → `400`.

---

## Users API — `/api/v1/users` (전 엔드포인트 **관리자 전용**)

| Method | Endpoint | 설명 | 코드 |
|--------|----------|------|------|
| GET | `` | 사용자 목록 (sort_order 순) | 200 |
| POST | `` | 사용자 생성 | 201 |
| PUT | `/reorder` | 순서 재정렬 `{ ids: [] }` | 200 |
| PUT | `/{user_id}` | 수정(display_name/role/is_active) | 200 |
| DELETE | `/{user_id}` | 삭제 | 204 |
| POST | `/{user_id}/reset-password` | 비밀번호 초기화 `{ new_password }` | 200 |

```jsonc
// POST (create)
{ "username": "hong", "password": "pw1234", "display_name": "홍길동", "role": "user" }
```
- 아이디 중복 → `409`, 비밀번호 6자 미만 → `400`
- **`admin` 계정은 수정/삭제 불가** → `403` (보호정책, `auth.md`)

---

## Projects API — `/api/v1/projects`

| Method | Endpoint | 인증 | 설명 | 코드 |
|--------|----------|------|------|------|
| GET | `` | 로그인 | 프로젝트 목록 (sort_order 순) | 200 |
| POST | `` | 관리자 | 생성 `{ name }` | 201 |
| PUT | `/reorder` | 관리자 | 순서 재정렬 `{ ids: [] }` | 200 |
| PUT | `/{project_id}` | 관리자 | 이름 수정 | 200 |
| DELETE | `/{project_id}` | 관리자 | 삭제 | 204 |

- 프로젝트명 중복 → `409`, 없는 프로젝트 → `404`
- 삭제 시 참조 `report_entries`는 DB에서 CASCADE 삭제 (`db.md`)

---

## Weeks API — `/api/v1/weeks`

| Method | Endpoint | 인증 | 설명 | 코드 |
|--------|----------|------|------|------|
| GET | `` | 로그인 | 주차 목록(+total/done 인원수) | 200 |
| POST | `` | 관리자 | 주차 생성 | 201 |
| DELETE | `/{week_id}` | 관리자 | 주차 삭제(보고 CASCADE) | 204 |
| GET | `/{week_id}/members` | 로그인 | 주차별 멤버 상태 목록 | 200 |
| GET | `/{week_id}/summary` | 로그인 | 전체 취합본(프로젝트별 금주/차주) | 200 |

```jsonc
// POST (create) — year+month+week_num 조합은 고유
{ "year": 2026, "month": 8, "week_num": 2, "title": "8월 2주차",
  "start_date": "2026-08-10", "end_date": "2026-08-14" }
```
- 주차 중복(year/month/week_num) → `409`, 없는 주차 → `404`
- `total_members` = 활성 사용자 수, `done_members` = 상태 done 보고 수

---

## Reports API — `/api/v1/reports`

| Method | Endpoint | 인증 | 설명 |
|--------|----------|------|------|
| GET | `/{week_id}/{user_id}` | 로그인+접근검사 | 보고 조회(없으면 status="none", 빈 entries) |
| PUT | `/{week_id}/{user_id}` | 로그인+접근검사 | 보고 저장(entries 전체 교체) |
| PATCH | `/{week_id}/{user_id}/status` | 로그인+접근검사 | 상태 변경(none/draft/done) |

```jsonc
// PUT (save)
{ "entries": [ { "project_id": 3, "current_work": "...", "next_work": "..." } ] }
// PATCH status
{ "status": "done" }
```
- **접근검사**: 관리자이거나 본인(`current_user.id == user_id`)만 허용, 아니면 `403`
- 유효하지 않은 status 값 → `400`

---

## 기타

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/` | `{ "message": "AI Weekly Hub API" }` |
| GET | `/docs` | Swagger UI |

---

## 에러 코드 요약

| 코드 | 상황 |
|------|------|
| 401 | 미인증/토큰 무효/로그인 실패 |
| 403 | 권한 없음(관리자 전용, 타인 보고 접근, admin 계정 수정·삭제) |
| 404 | 리소스 없음(user/project/week) |
| 409 | 중복(username/project name/week 조합) |
| 400 | 유효성 실패(비밀번호 길이, status 값 등) |
