# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 프로젝트 개요

**AI_HUB** — 프로젝트 대시보드 + 주간보고를 하나로 묶은 통합 서비스.
기존 주간보고 앱(weekly_hub)을 확장해 상위 축으로 **프로젝트 대시보드/관리**를 얹었다.

- **프로젝트 대시보드**: 전체 프로젝트 현황(코드·유형·PM·팀원·상태)을 카드/리스트로 시각화, 개인별 순서·유형 필터
- **프로젝트 상세**: 소개·유형·기간·NAS·Git·팀원 + 주간 진행(read-only) + 변경 이력(감사)
- **주간보고**: 주차별 개인 업무 작성 + 전체 취합
- **설정**(5탭): 프로젝트 관리 / 유형·상태 관리 / 인력 관리 / 시스템(권한) 관리 / 관리이력(감사 로그)
- 로그인/권한(전역 관리자·일반 + 프로젝트별 PM·팀원) 기반, 다크모드 지원
- 데이터 보존: 프로젝트/주차/사용자 삭제는 과거 주간보고를 보존(스냅샷·소프트 삭제), 주간보고 작성은 본인만

> 리포지토리 리모트는 여전히 `weekly_hub.git` (로컬 디렉토리만 ai_weekly_hub).

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 19 + TypeScript + Vite + MUI v5 + React Router v7 + @dnd-kit |
| Backend | Python 3.9 + FastAPI + SQLAlchemy 2.0 + Pydantic v2 |
| Auth | JWT(python-jose) + bcrypt(passlib) |
| Database | PostgreSQL `weekly_hub_db`, 스키마 분리 `common` / `weekly` |
| 통신 | REST API `/api/v1/`, 개발은 Vite proxy(`/api`→8081), baseURL은 `VITE_API_BASE` 환경변수 |

---

## 디렉토리 구조

```
ai_weekly_hub/
├── frontend/                # React + TS + Vite (포트 5174)
│   └── src/
│       ├── api/             # axios 클라이언트 (auth/user/project/week/report/meta/dashboard/permission)
│       ├── components/      # layout/, project/, report/, settings/, week/
│       ├── contexts/        # AuthContext, ColorModeContext(다크모드)
│       ├── pages/           # Dashboard, ProjectDetail, ClosedProjects, MainPage(주간보고), WeekDetail, Settings, Login
│       ├── theme.ts         # 라이트/다크 테마
│       └── types/
├── backend/                 # FastAPI (포트 8081)
│   ├── app/
│   │   ├── main.py          # 앱, CORS, 라우터 등록, create_all, seed
│   │   ├── ordering.py      # 사용자 표시 정렬(직책순→가나다)
│   │   ├── auth/            # jwt, dependencies(get_current_user/require_admin)
│   │   ├── models/          # user, project(+type/status/member/log), user_project_order, role_permission, week, report
│   │   ├── schemas/ routers/ services/
│   └── migrations/          # 001~007 SQL (수기 실행)
├── md/                      # 문서 9종 (이 폴더)
├── design/                  # 설계 산출물(ERD/유스케이스 mmd)
└── start.sh / stop.sh
```

---

## 빠른 실행

```bash
./start.sh      # 백엔드(8081) + 프론트(5174) 백그라운드
./stop.sh
```
- Frontend: http://localhost:5174  ·  Backend docs: http://localhost:8081/docs
- 최초 로그인: `admin` / `admin1234` (seed). 상세는 `auth.md`, 실행/배포는 `deploy.md`.

---

## 핵심 도메인

- **User**: 계정 + 전역역할(admin/user) + 직책(position)·소속(team)
- **Project**: 코드·정식명칭(full_name)·소개·유형·상태·PM·기간·NAS·Git·노출설정(대시보드/주간보고)
- **ProjectType/Status**: 유형(PoC/본사업/연구개발/기획/기타)·상태(진행중/완료) 마스터
- **ProjectMember**: 프로젝트별 인력 배정 + 역할(pm/member)
- **ProjectLog**: 감사 로그(마감일·상태·PM·팀원 변경)
- **UserProjectOrder**: 사용자별 대시보드 표시 순서(개인화)
- **RolePermission**: 역할별 권한 설정(시스템 관리)
- **Week / Report / ReportEntry**: 주차·주간보고·프로젝트별 금주/차주 항목

---

## 문서 맵

| 파일 | 내용 |
|------|------|
| `CLAUDE.md` | 전체 아키텍처/개요 (이 파일) |
| `front.md` | 프론트 UI/UX |
| `backend.md` | 백엔드 API 명세 |
| `function.md` | 비즈니스 로직/기능 |
| `auth.md` | 인증·권한 |
| `deploy.md` | 빌드·배포·실행 |
| `infra.md` | 포트·구성 |
| `db.md` | DB 스키마(단일 원천) |
| `logs.md` | 서버 로그 |
