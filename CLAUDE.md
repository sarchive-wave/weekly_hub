# CLAUDE.md
# AI Weekly Hub - 메인 설정 파일
# 이 파일은 프로젝트 전체 구조와 각 명세 파일의 역할을 정의한다.
# Claude Code가 이 파일을 먼저 읽고 하위 명세 파일들을 참조하여 개발한다.

---

## 프로젝트 개요

**서비스명**: AI Weekly Hub
**목적**: 팀원별 주간보고를 프로젝트 단위로 자동 취합하여 통합 주간업무 현황을 관리하는 시스템
**디렉토리**: `~/Desktop/claude/weekly_hub/`

---

## 명세 파일 역할

| 파일 | 역할 |
|------|------|
| `CLAUDE.md` | 프로젝트 전체 구조 정의 및 명세 파일 참조 가이드 (이 파일) |
| `technical.md` | DB 스키마, API 구성, 메뉴 구조, 기술 스택 등 테크니컬 명세 |
| `auth.md` | 로그인/패스워드/JWT/권한 관련 명세 및 보안 정책 |
| `frontend.md` | 화면 레이아웃, 컴포넌트 구조, UI/UX 명세 |
| `backend.md` | FastAPI 라우터, 서비스 로직, DB 연동 명세 |

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| Frontend | React 18 + TypeScript + Vite + Material UI v5 |
| Backend | Python 3.9+ + FastAPI + SQLAlchemy 2.0 + JWT 인증 |
| Database | SQLite (추후 PostgreSQL 전환 가능) |
| 통신 | REST API (`/api/v1/`) |
| 인증 | JWT (Bearer Token, localStorage 저장) |

---

## 디렉토리 구조

```
weekly_hub/
├── frontend/
│   └── src/
│       ├── api/          # axios API 호출
│       ├── components/   # 재사용 UI 컴포넌트
│       ├── contexts/     # AuthContext (JWT 관리)
│       ├── hooks/        # useAuth, useWeek, useReport 등
│       ├── pages/        # LoginPage, MainPage, WeekDetailPage, SettingsPage
│       └── types/        # TypeScript 인터페이스
├── backend/
│   └── app/
│       ├── main.py       # FastAPI 앱 진입점
│       ├── database.py   # SQLAlchemy 엔진/세션
│       ├── config.py     # 환경변수
│       ├── models/       # ORM 모델
│       ├── schemas/      # Pydantic 스키마
│       ├── routers/      # API 엔드포인트
│       ├── services/     # 비즈니스 로직
│       └── auth/         # JWT 토큰 생성/검증
├── CLAUDE.md
├── technical.md
├── auth.md
├── frontend.md
└── backend.md
```

---

## 포트

| 서비스 | 포트 |
|--------|------|
| Frontend (Vite) | 5174 |
| Backend (FastAPI) | 8081 |

---

## 실행 명령어

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8081
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

---

## 개발 규칙

- 명세 파일 변경 시 CLAUDE.md도 함께 업데이트
- API prefix: `/api/v1/`
- 공통 응답: `{ success, data, message }`
- JWT 토큰은 Authorization 헤더로 전달: `Bearer {token}`
