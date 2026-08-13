# Logs

서비스 기동 시 남기는 서버 로그.

## 위치
`start.sh` 기동 시 프로젝트 루트에 기록.
| 파일 | 내용 |
|------|------|
| `backend.log` | 백엔드(Uvicorn/FastAPI) stdout·stderr |
| `frontend.log` | 프론트(Vite) stdout·stderr |
| `backend.pid` / `frontend.pid` | 프로세스 PID (stop.sh 사용) |
> `*.log`, `*.pid`는 git 미추적(`.gitignore`). start.sh는 재기동마다 로그를 새로 씀(truncate).

## 실시간 확인
```bash
tail -f backend.log
tail -f frontend.log
```

## 형식 (Uvicorn)
```
INFO: Uvicorn running on http://127.0.0.1:8081
INFO: 127.0.0.1:xxxxx - "POST /api/v1/auth/login HTTP/1.1" 200 OK
INFO: 127.0.0.1:xxxxx - "GET /api/v1/dashboard HTTP/1.1" 200 OK
```
- 인증 실패(401)/권한 없음(403) 등도 상태코드로 남는다.

## 상태코드 참고
| 코드 | 의미 |
|------|------|
| 200 | 조회/수정/저장 성공 |
| 201 | 생성(project/user/week/meta) |
| 204 | 삭제(본문 없음) |
| 400 | 유효성(비번 6자·주차 날짜·status 값) |
| 401 | 미인증/토큰 무효/로그인 실패 |
| 403 | 권한 없음(관리자 전용·타인 보고·admin 보호) |
| 404 | 리소스 없음 |
| 409 | 중복(username/code/name/week/마스터 사용중) |

## 운영 팁
- 서비스가 안 뜨면 `backend.log` 마지막에서 DB 접속 실패(`psycopg2.OperationalError`)·포트 점유 확인.
- 로그는 append로 커짐 → 필요 시 `: > backend.log`.
- 파일 로깅은 nohup 리다이렉트 기반. 레벨/구조화가 필요하면 Uvicorn `--log-config` 검토(TBD).
