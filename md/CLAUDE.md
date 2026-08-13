# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**AI Weekly Hub** — 팀 주간보고 관리 시스템.
관리자가 주차(week)를 생성하면 팀원이 프로젝트별로 금주/차주 업무를 작성하고, 관리자는 팀 전체 취합본을 확인·미리보기(복사용 팝업)할 수 있다.
로그인/권한(관리자·일반) 기반이며 계정·프로젝트를 관리자가 설정에서 관리한다.

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite + Material UI v5 + React Router v7 |
| Backend | Python 3.9 + FastAPI + SQLAlchemy 2.0 + Pydantic v2 |
| Auth | JWT (python-jose) + bcrypt(passlib) 비밀번호 해시 |
| Database | PostgreSQL (`weekly_hub_db`) |
| 통신 | REST API (`/api/v1/`), 프론트가 백엔드(8081)를 직접 호출 (CORS 허용) |

---

## 디렉토리 구조

```
weekly_hub/
├── frontend/                # React + TS + Vite (포트 5174)
│   └── src/
│       ├── api/             # axios 클라이언트 (client, auth/user/project/week/reportApi)
│       ├── components/      # layout/, report/, settings/, week/
│       ├── contexts/        # AuthContext (로그인 상태·권한)
│       ├── pages/           # LoginPage, MainPage, WeekDetailPage, SettingsPage
│       └── types/           # 공용 TypeScript 인터페이스
├── backend/                 # FastAPI (포트 8081)
│   └── app/
│       ├── main.py          # 앱 진입점, CORS, 라우터 등록, 테이블 생성, seed
│       ├── config.py        # 환경변수(.env)
│       ├── database.py      # SQLAlchemy 엔진/세션/get_db
│       ├── seed.py          # 최초 admin 계정 생성
│       ├── auth/            # jwt(토큰), dependencies(get_current_user/require_admin)
│       ├── models/          # User, Project, Week, Report, ReportEntry
│       ├── schemas/         # Pydantic 요청/응답
│       ├── routers/         # auth, users, projects, weeks, reports
│       └── services/        # 도메인별 비즈니스 로직
├── start.sh / stop.sh       # 서비스 일괄 실행/종료
└── *.md                     # 문서 (아래 표)
```

---

## 빠른 실행

```bash
./start.sh      # 백엔드(8081) + 프론트엔드(5174) 백그라운드 기동
./stop.sh       # 종료
```

- Frontend: http://localhost:5174
- Backend API 문서: http://localhost:8081/docs
- 최초 로그인 계정: `admin` / `admin1234` (seed 생성, 상세는 `auth.md`)
- 상세 실행/배포는 `deploy.md`, 포트/구성은 `infra.md`.

---

## 핵심 도메인

- **User**: 팀원 계정(관리자/일반), 정렬순서, 활성여부
- **Project**: 업무 프로젝트(고유명), 정렬순서
- **Week**: 주차(year·month·week_num 고유), 제목, 기간
- **Report**: (week, user) 단위 주간보고, 상태(none/draft/done)
- **ReportEntry**: 보고 내 프로젝트별 금주/차주 업무 텍스트

---

## API 규칙

- Prefix: `/api/v1/`, 인증: `Authorization: Bearer <JWT>`
- 대부분 엔드포인트는 응답 모델을 **직접 반환**(래퍼 없음). 일부 액션(reorder/reset-password/change-password)만 `{success, data, message}` 반환
- 권한: `get_current_user`(로그인 필요), `require_admin`(관리자 전용)
- 전체 엔드포인트는 `backend.md`, 권한 매트릭스는 `auth.md` 참조

---

## 문서 맵

| 파일 | 내용 |
|------|------|
| `CLAUDE.md` | 전체 아키텍처/개요 (이 파일) |
| `front.md` | 프론트엔드 UI/UX 명세 |
| `backend.md` | 백엔드 API 명세 |
| `function.md` | 비즈니스 로직/기능 정의 |
| `auth.md` | 권한·계정 관리 (JWT/역할/보호정책) |
| `deploy.md` | 빌드·배포·실행 방법 |
| `infra.md` | 포트·서비스 구성 |
| `db.md` | 테이블/ERD/컬럼/인덱스/관계 |
| `logs.md` | 서버 로그 |
