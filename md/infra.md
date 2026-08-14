# Infrastructure

포트, 서비스 구성, 네트워크 방향.

## 구성도
```
┌───────────┐ /api (Vite proxy) ┌──────────┐  psycopg2  ┌───────────────┐
│ Frontend  │ ────────────────►│ Backend  │ ─────────►│ PostgreSQL     │
│ Vite :5174│   → :8081        │ FastAPI  │  (5432)   │ weekly_hub_db  │
└───────────┘ ◄────────────────│  :8081   │ ◄─────────│ (common/weekly)│
     ▲  JWT+JSON               └──────────┘  rows      └───────────────┘
  사용자(브라우저)
```
- 프론트 axios `baseURL = import.meta.env.VITE_API_BASE ?? ''`(상대경로 기본). **개발은 Vite proxy가 `/api`를 `VITE_DEV_API_TARGET||http://localhost:8081`로 포워딩** → 하드코딩 URL 없음, CORS 부담 완화. `VITE_API_BASE`를 지정하면 절대 URL로 직접 호출(이 경우 백엔드 `CORS_ORIGINS`에 오리진 포함 필요).
- 인증 JWT(로컬스토리지). 상세 `auth.md`.

## 포트
| 서비스 | 포트 | 비고 |
|--------|------|------|
| Frontend (Vite) | 5174 | `npm run dev` |
| Backend (Uvicorn) | 8081 | `uvicorn app.main:app --port 8081` |
| PostgreSQL | 5432 | `weekly_hub_db` |
> 같은 머신의 to_do(5173/8080)와 포트가 겹치지 않아 동시 구동 가능.

## 환경변수 (`backend/.env`)
| 키 | 예시 | 설명 |
|----|------|------|
| SECRET_KEY | (개발 placeholder) | JWT 서명 — 운영 전 교체 |
| ALGORITHM | HS256 | |
| ACCESS_TOKEN_EXPIRE_MINUTES | 480 | 토큰 만료(분) |
| DATABASE_URL | postgresql://sarchive:todo1234@localhost:5432/weekly_hub_db | DB 접속 |
| CORS_ORIGINS | http://localhost:5174,http://192.168.2.126:5174 | 허용 오리진(콤마) |
- `.env`는 git 미추적(`.gitignore`). 없으면 `config.py` 기본값 사용.

## 환경변수 (`frontend/.env`)
| 키 | 예시 | 설명 |
|----|------|------|
| VITE_API_BASE | (빈값) | axios baseURL. 비우면 상대경로+프록시 사용, 채우면 절대 URL 직접 호출 |
| VITE_DEV_API_TARGET | http://localhost:8081 | Vite dev proxy `/api` 포워딩 대상 |
- 템플릿 `frontend/.env.example` 제공. 타입 선언 `src/vite-env.d.ts`.

## 네트워크
| 방향 | 출발 | 도착 | 프로토콜 |
|------|------|------|----------|
| 사용자→프론트 | 브라우저 | :5174 | HTTP |
| 프론트→백엔드 | axios(`/api` 프록시) | :8081 | HTTP + JWT |
| 백엔드→DB | psycopg2 | :5432 | PostgreSQL |
- 공유 호스트 IP `192.168.2.126`. 다른 기기 접근 시 `frontend/.env`의 `VITE_DEV_API_TARGET`/`VITE_API_BASE`로 대상 조정(코드 수정 불필요).

## 런타임 버전
Python 3.9 · Node v26 · PostgreSQL 14+

## TBD
- 프로덕션 정적 빌드 + 리버스 프록시, SECRET_KEY 시크릿 관리.
