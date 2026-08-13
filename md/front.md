# Frontend UI/UX Specification

## 기술 스택

- React 19 + TypeScript + Vite
- Material UI (MUI) v5 + @mui/icons-material
- React Router v7
- Axios (`api/client.ts`, baseURL `http://localhost:8081` 직접 호출)
- @dnd-kit (프로젝트 정렬 드래그, ProjectTab)

> 인증 상태는 `contexts/AuthContext`(Context API)로 전역 관리. 별도 상태관리 라이브러리 없음.

---

## 라우팅 (`App.tsx`)

| Path | 컴포넌트 | 가드 |
|------|----------|------|
| `/login` | `LoginPage` | 비로그인 전용(로그인 시 `/`로) |
| `/` | `MainPage` | `RequireAuth` |
| `/weeks/:weekId` | `WeekDetailPage` | `RequireAuth` |
| `/settings` | `SettingsPage` | `RequireAdmin` |
| `*` | → `/` | |

- `RequireAuth`: 미로그인 시 `/login`. `RequireAdmin`: 비관리자 시 `/`.

---

## 공통 레이아웃 (`components/layout/AppLayout`)

- 상단 AppBar(다크 `#1E293B`): 좌측 "AI Weekly Hub"(홈 이동), 우측 설정 아이콘(관리자만)·계정 메뉴.
- 계정 메뉴: 표시이름 / 비밀번호 변경(`ChangePasswordDialog`) / 로그아웃.

---

## 1. 로그인 (`/login`, `LoginPage`)

- 중앙 카드: 아이디/비밀번호 입력 + 로그인 버튼, 폼 제출(Enter) 지원.
- 실패 시 상단 Alert("아이디 또는 비밀번호가 올바르지 않습니다.").

---

## 2. 메인 — 주간현황 (`/`, `MainPage`)

- 헤더: 제목 "주간현황" + (관리자) "주차 추가" 버튼.
- 월 네비게이터: `< 연도 월 >` — 연/월 텍스트 클릭 시 Popover로 선택(연도 ±5, 월 그리드).
- 선택된 연·월에 해당하는 주차 카드(`WeekCard`) 그리드(반응형 3열).
  - 카드: 주차 제목, 작성완료/전체 인원 진행률, (관리자) 삭제.
  - 클릭 시 `/weeks/:id` 이동.
- 빈 상태: "N년 M월에 등록된 주차가 없습니다." + (관리자) 추가 버튼.
- 주차 생성: `WeekCreateDialog`. 삭제: 확인 다이얼로그(보고 함께 삭제 경고).

---

## 3. 주차 상세 (`/weeks/:weekId`, `WeekDetailPage`)

- 좌측 사이드바(240px):
  - "목록으로" 뒤로가기 + 같은 달 주차 이전/다음 이동(`< 주차 >`).
  - "전체" 메뉴 + 멤버 목록(상태 색 점: done=파랑, 그 외 회색).
- 우측 콘텐츠:
  - "전체" 선택 → `OverallReport` (팀 취합본)
  - 멤버 선택 → `PersonalReport` (개인 주간보고)

### 3-1. 개인 보고 (`components/report/PersonalReport`)
- 헤더: "{이름}의 주간보고" + 오늘 날짜 + 작성완료 토글(본인/관리자만).
- 편집(본인 또는 관리자): + 버튼으로 프로젝트 슬롯 추가 → 프로젝트 선택 → 금주/차주 텍스트 입력 → 저장.
  - 슬롯 카드 헤더(다크)에서 프로젝트 Select(이미 선택된 건 제외, 영문 우선·이름순 정렬).
  - 저장 성공 시 Snackbar("작성 완료 되었습니다.").
- 읽기전용(타인, 비관리자): 저장된 엔트리만 카드로 표시.
- 금주/차주 날짜 라벨은 `weekStartDate` 또는 year/month/week_num으로 월~금 계산.

### 3-2. 전체 취합 (`components/report/OverallReport`)
- 프로젝트별로 팀원들의 금주/차주 업무를 2열(금주/차주)로 취합 표시.
- "휴가 및 교육" 프로젝트는 항상 마지막에 고정(pinned, 파란 강조).
- "미리보기" 버튼: 복사용 HTML 팝업 창(`window.open`)으로 취합본 렌더 — 텍스트 드래그 복사 용도.

---

## 4. 설정 (`/settings`, `SettingsPage`, 관리자 전용)

탭 2개:
- **계정 관리(`AccountTab`)**: 사용자 목록/생성/수정/삭제/비밀번호 초기화/드래그 정렬. admin 계정은 보호(수정·삭제 불가).
- **프로젝트 관리(`ProjectTab`)**: 프로젝트 목록/생성/수정/삭제 + @dnd-kit 드래그 정렬.

---

## 컴포넌트 트리

```
App (Theme, Router, AuthProvider)
└── AppRoutes
    ├── LoginPage
    ├── MainPage ── AppLayout, WeekCard, WeekCreateDialog
    ├── WeekDetailPage ── AppLayout, OverallReport, PersonalReport
    └── SettingsPage ── AppLayout, AccountTab, ProjectTab
AppLayout ── ChangePasswordDialog
```

---

## API 클라이언트 (`api/`)

| 파일 | 대상 |
|------|------|
| `client.ts` | axios 인스턴스(토큰 인터셉터, 401 처리) |
| `authApi` | login / me / changePassword |
| `userApi` | 사용자 CRUD·정렬·비번초기화 |
| `projectApi` | 프로젝트 CRUD·정렬 |
| `weekApi` | 주차 list/create/delete, members, summary |
| `reportApi` | 보고 get / save / updateStatus |

---

## 스타일 가이드

| 항목 | 값 |
|------|----|
| Primary | `#3B82F6` / Warning `#F59E0B` |
| 배경 | `#F8FAFC` |
| 다크 헤더/카드헤더 | `#1E293B` (pinned `#1E40AF`) |
| 상태 done 색 | `#3B82F6` / 그 외 `#94A3B8` |
| 폰트 | Noto Sans KR, Roboto |
| 버튼 | `textTransform: none`, radius 8 |
