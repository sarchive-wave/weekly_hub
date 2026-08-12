# Build / Deploy / Run

서버 빌드·배포·실행 방법. 포트/구성은 `infra.md`, DB는 `db.md`, 인증은 `auth.md` 참조.

## 사전 준비

| 대상 | 버전 |
|------|------|
| Python | 3.9+ |
| Node.js | 20+ (개발 검증 v26) |
| PostgreSQL | 14+ (DB `weekly_hub_db`, 사용자 `sarchive`) |

PostgreSQL 초기 준비 예시:
```bash
createdb weekly_hub_db
# 또는: CREATE DATABASE weekly_hub_db OWNER sarchive;
```
> 테이블은 백엔드 최초 기동 시 `create_all`로 자동 생성되고, `admin/admin1234` 계정이 seed로 생성된다(`auth.md`).

---

## 방법 A) 스크립트 일괄 실행 (권장)

```bash
./start.sh     # 백엔드(8081) + 프론트엔드(5174) 백그라운드 기동
./stop.sh      # 두 서비스 종료
```

- `start.sh`: `nohup`으로 백그라운드 실행, PID를 `backend.pid`/`frontend.pid`, 로그를 `backend.log`/`frontend.log`에 기록(`logs.md`).
- `stop.sh`: PID 파일로 각 프로세스 종료.

> 주의: `start.sh`는 포트 중복 검사를 하지 않는다. 재기동 시 `./stop.sh` 후 `./start.sh` 권장.

---

## 방법 B) 수동 실행

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt
# backend/.env 준비 (SECRET_KEY, DATABASE_URL, CORS_ORIGINS 등 — infra.md)
uvicorn app.main:app --port 8081
```
- API 문서: http://localhost:8081/docs

### Frontend
```bash
cd frontend
npm install
npm run dev                        # http://localhost:5174 (개발)
npm run build                      # 타입체크(tsc -b) + 프로덕션 빌드 → dist/
npm run preview                    # 빌드 결과 미리보기
npm run lint                       # oxlint
```

> **빌드 주의**: `npm run build`는 `tsc -b`를 먼저 돌리며, tsconfig에 `noUnusedLocals`/`noUnusedParameters`가 켜져 있어 **미사용 변수/import가 있으면 빌드가 실패**한다. 커밋 전 `npm run build`로 확인 권장.

---

## 의존성

**Backend** (`backend/requirements.txt`)
```
fastapi
uvicorn[standard]
sqlalchemy
python-jose[cryptography]      # JWT
passlib[bcrypt]               # 비밀번호 해시
bcrypt==4.0.1
python-dotenv
pydantic[email]
psycopg2-binary               # PostgreSQL 드라이버
```
> bcrypt만 버전 고정. 재현성이 필요하면 전체 버전 핀 고려(TBD).

**Frontend**: React 19, MUI v5, @mui/icons-material, react-router-dom v7, axios, @dnd-kit/* (상세 `frontend/package.json`). `@emotion/*`는 MUI peer 의존성.

---

## 배포 체크리스트

- [ ] PostgreSQL 기동 및 `weekly_hub_db` 접근 확인
- [ ] `backend/.env`의 `DATABASE_URL`, `CORS_ORIGINS`, `SECRET_KEY` 확인 (운영은 SECRET_KEY 교체)
- [ ] 백엔드 기동 후 `GET /` → `{"message":"AI Weekly Hub API"}` 확인
- [ ] `admin/admin1234` 로그인 후 **비밀번호 즉시 변경**
- [ ] 프론트 `client.ts` baseURL이 대상 환경과 맞는지 확인(하드코딩, `infra.md`)
- [ ] 코드 변경 반영: `./stop.sh && ./start.sh`

---

## 프로덕션 주의 (현재 개발 구성 기준)

- 프론트는 Vite dev server로 서빙 중 → 실서비스는 `npm run build` 산출물(`dist/`)을 정적 서버/리버스 프록시로 서빙 권장.
- 프론트 API baseURL이 `http://localhost:8081`로 하드코딩 → 다른 호스트 배포 시 수정 필요(환경변수화 권장).
- JWT `SECRET_KEY` 개발용 기본값 → 운영 전 반드시 교체(`auth.md`).
