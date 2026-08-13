# Logs

서비스 기동 시 남기는 서버 로그 정의.

## 위치

`start.sh` 기동 시 프로젝트 루트에 기록된다.

| 파일 | 내용 |
|------|------|
| `backend.log` | 백엔드(Uvicorn/FastAPI) stdout·stderr |
| `frontend.log` | 프론트엔드(Vite) stdout·stderr |
| `backend.pid` | 백엔드 프로세스 PID (stop.sh가 사용) |
| `frontend.pid` | 프론트엔드 프로세스 PID |

> `*.log`, `*.pid`는 런타임 산출물이라 git 추적 제외(`.gitignore`).

---

## 실시간 확인

```bash
tail -f backend.log
tail -f frontend.log
```

---

## 로그 형식

### Backend (Uvicorn)
```
INFO:     Uvicorn running on http://127.0.0.1:8081 (Press CTRL+C to quit)
INFO:     127.0.0.1:59377 - "POST /api/v1/auth/login HTTP/1.1" 200 OK
INFO:     127.0.0.1:59380 - "GET /api/v1/weeks HTTP/1.1" 200 OK
```
- `클라이언트 - "메서드 경로 프로토콜" 상태코드 사유` 형식.
- 인증 실패(401), 권한 없음(403) 등도 해당 요청 라인에 상태코드로 남는다.

### Frontend (Vite)
```
VITE v8.x  ready in NNN ms
➜  Local:   http://localhost:5174/
```
- dev 서버 시작 배너, HMR 갱신, 타입/빌드 경고.

---

## 상태코드 참고 (이 앱)

| 코드 | 의미 |
|------|------|
| 200 | 조회/수정/저장/상태변경 성공 |
| 201 | 생성 성공 (user/project/week) |
| 204 | 삭제 성공 (본문 없음) |
| 400 | 유효성 실패(비밀번호 길이, status 값) |
| 401 | 미인증/토큰 무효/로그인 실패 |
| 403 | 권한 없음(관리자 전용/타인 보고/admin 보호) |
| 404 | 리소스 없음 |
| 409 | 중복(username/project/week) |

정책 상세는 `backend.md`, `auth.md`, `function.md`.

---

## 운영 팁

- 서비스가 안 뜨면 `backend.log` 마지막에서 DB 접속 실패(`psycopg2.OperationalError`)·포트 점유 여부 확인.
- 로그는 append로 계속 커진다 — 필요 시 `: > backend.log`로 비우기.
- 파일 로깅은 `nohup` 리다이렉트 기반. 레벨 조정/구조화 로깅이 필요하면 Uvicorn `--log-config` 도입 검토(TBD).
