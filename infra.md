# Infrastructure

포트, 서비스 구성, 네트워크 방향 정의.

## 서비스 구성도

```
┌─────────────┐   HTTP(직접호출)  ┌──────────────┐   psycopg2   ┌──────────────┐
│  Frontend   │ ───────────────► │   Backend    │ ───────────► │  PostgreSQL  │
│  Vite dev   │  localhost:8081  │  FastAPI     │  (5432)      │ weekly_hub_db│
│  :5174      │ ◄─────────────── │  Uvicorn     │ ◄─────────── │  :5432       │
└─────────────┘   JSON+JWT       │  :8081       │   rows       └──────────────┘
      ▲                          └──────────────┘
      │ 브라우저(사내망)
   사용자
```

- 프론트는 **Vite proxy 없이** axios `baseURL: http://localhost:8081`로 백엔드를 직접 호출한다(`api/client.ts`).
  따라서 백엔드 CORS(`CORS_ORIGINS`)에 프론트 오리진이 반드시 포함돼야 한다.
- 인증은 JWT Bearer 토큰(로컬스토리지 저장). 상세 `auth.md`.

---

## 포트

| 서비스 | 포트 | 비고 |
|--------|------|------|
| Frontend (Vite) | 5174 | `npm run dev` (vite.config.ts) |
| Backend (FastAPI/Uvicorn) | 8081 | `uvicorn app.main:app --port 8081` |
| PostgreSQL | 5432 | DB `weekly_hub_db` |

> 같은 머신의 `to_do` 프로젝트(5173/8080)와 포트가 겹치지 않아 동시 구동 가능.

---

## 환경변수 (`backend/.env`)

| 키 | 예시/기본 | 설명 |
|----|-----------|------|
| `SECRET_KEY` | (개발용 placeholder) | JWT 서명 키 — **운영 전 교체** |
| `ALGORITHM` | `HS256` | JWT 알고리즘 |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | 토큰 만료(분) |
| `DATABASE_URL` | `postgresql://sarchive:todo1234@localhost:5432/weekly_hub_db` | DB 접속 |
| `CORS_ORIGINS` | `http://localhost:5174,http://192.168.2.126:5174` | 허용 오리진(콤마 구분) |

- `.env`는 git에 커밋하지 않음(`.gitignore`). 없을 경우 `config.py` 기본값 사용(개발 편의).

---

## 네트워크 / 접근

| 방향 | 출발 | 도착 | 프로토콜 |
|------|------|------|----------|
| 사용자 → 프론트 | 브라우저 | :5174 | HTTP |
| 프론트 → 백엔드 | axios | :8081 | HTTP + JWT |
| 백엔드 → DB | psycopg2 | :5432 | PostgreSQL |

- 공유 호스트 IP: `192.168.2.126`. 다른 기기에서 접근하려면:
  - 백엔드 `CORS_ORIGINS`에 해당 오리진 포함(현재 `192.168.2.126:5174` 포함)
  - 프론트 `client.ts`의 `baseURL`가 `localhost:8081` 하드코딩이라 **다른 기기 접근 시 조정 필요**(개선 여지)

---

## 런타임 버전

| 대상 | 버전 |
|------|------|
| Python | 3.9 |
| Node.js | v26 |
| PostgreSQL | 14+ |

---

## 향후 고려 (TBD)

- 프론트 `baseURL` 하드코딩 → 환경변수(`VITE_API_BASE`)화하면 네트워크/배포 유연.
- 운영 배포 시 Vite dev 대신 정적 빌드 + 정적 서버/리버스 프록시 구성.
- `SECRET_KEY` 등 시크릿 관리 체계화(현재 평문 `.env`).
