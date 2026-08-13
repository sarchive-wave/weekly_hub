# Build / Deploy / Run

포트/구성은 `infra.md`, DB는 `db.md`, 인증은 `auth.md`.

## 사전 준비
| 대상 | 버전 |
|------|------|
| Python | 3.9+ |
| Node.js | 20+ (개발 v26) |
| PostgreSQL | 14+ (DB `weekly_hub_db`, 사용자 `sarchive`) |

## 실행 (스크립트)
```bash
./start.sh   # 백엔드(8081) + 프론트(5174) 백그라운드(nohup), 로그 backend.log/frontend.log
./stop.sh
```
> 재기동은 `./stop.sh && ./start.sh`. start.sh는 포트 중복 검사를 하지 않음.
> 디렉토리를 옮기면 venv 경로가 깨지므로 venv 재생성 필요.

## 수동 실행
```bash
# Backend
cd backend && python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt        # psycopg2-binary 포함
# backend/.env 준비 (SECRET_KEY, DATABASE_URL, CORS_ORIGINS — infra.md)
uvicorn app.main:app --port 8081

# Frontend
cd frontend && npm install
npm run dev        # http://localhost:5174
npm run build      # tsc -b + vite build → dist/
npm run preview
```

## DB 마이그레이션 (수기, 최초/변경 시 1회)
Alembic 미사용. 신규 환경/스키마 변경 시 순서대로 실행:
```bash
export PGPASSWORD=todo1234
for f in backend/migrations/00*.sql; do
  psql -h localhost -U sarchive -d weekly_hub_db -v ON_ERROR_STOP=1 -f "$f"
done
```
- 001 스키마 분리 → 002 개인순서 → 003 노출 → 004 정식명칭/유형.
- 앱 기동 시 `create_all`은 스키마 존재 시 기존 테이블을 건너뜀 → **마이그레이션을 먼저** 실행.

## 의존성
**Backend** (`backend/requirements.txt`): fastapi, uvicorn[standard], sqlalchemy, python-jose[cryptography], passlib[bcrypt], bcrypt==4.0.1, python-dotenv, pydantic[email], psycopg2-binary
**Frontend**: React 19, MUI v5, @mui/icons-material, react-router-dom v7, axios, @dnd-kit/*(@emotion은 MUI peer)

## 빌드 주의
`npm run build`는 `tsc -b`를 먼저 돌리며 `noUnusedLocals`가 켜져 있어 **미사용 변수/import가 있으면 빌드 실패**. 커밋 전 확인 권장.

## 체크리스트
- [ ] PostgreSQL 기동 + `weekly_hub_db` 접근
- [ ] 마이그레이션 001~004 적용
- [ ] `backend/.env`(SECRET_KEY/DATABASE_URL/CORS_ORIGINS) — 운영은 SECRET_KEY 교체
- [ ] `GET /` → `{"message":"AI Weekly Hub API"}`, admin 로그인 후 비번 변경
- [ ] 프론트 `client.ts` baseURL이 대상 환경과 일치(하드코딩, `infra.md`)

## 프로덕션 주의
- 프론트는 dev server 구동 중 → 실서비스는 `npm run build` 산출물을 정적 서버/리버스 프록시로 서빙 권장.
- baseURL 하드코딩 → 다른 호스트 배포 시 수정 필요.
