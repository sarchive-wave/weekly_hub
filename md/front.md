# Frontend UI/UX Specification

## 기술 스택
- React 19 + TypeScript + Vite, MUI v5 + @mui/icons-material
- React Router v7, axios(`api/client.ts`, baseURL `http://localhost:8081`)
- @dnd-kit(드래그 정렬), 다크모드(ColorModeContext + theme.ts)

## 라우팅 (`App.tsx`)
| Path | 화면 | 가드 |
|---|---|---|
| `/login` | 로그인 | 비로그인 전용 |
| `/` | **대시보드** | RequireAuth |
| `/projects/:id` | 프로젝트 상세 | RequireAuth |
| `/closed` | 종료 프로젝트 | RequireAuth |
| `/weekly` | 주간보고 홈(주차 목록) | RequireAuth |
| `/weeks/:weekId` | 주차 상세 | RequireAuth |
| `/settings` | 설정 | RequireAdmin |

## 공통 레이아웃 (AppLayout)
- 상단바: 좌측 "AI Weekly Hub", 내비 **대시보드 / 종료 / 주간보고**, 우측 **다크모드 토글** · (관리자)설정 · 계정메뉴.

## 1. 대시보드 (`/`, DashboardPage)
- 제목 + 요약(진행중·전체) + 우측 **오늘 날짜·요일**, 카드/리스트 뷰 토글, (관리자)프로젝트 등록.
- **유형 태그 칩**(솔리드 색) 클릭 → 해당 유형만 필터, "전체 보기"로 해제.
- 카드: 유형칩 + 드래그핸들, **코드+제목**, PM(검은 글자), 팀원 **이름 칩**(최대 4 + 외N).
- 리스트: 유형 · 프로젝트(코드+명) · PM · 팀원.
- **드래그로 개인 순서 변경**(필터 중 비활성). 항목 클릭 → 상세.

## 2. 프로젝트 상세 (`/projects/:id`)
- 헤더: 코드·이름·상태칩 + (관리자/PM) 팀원·수정·완료/재개.
- 정보: 유형·PM·기간·NAS·Git·소개 / 팀원 목록(직책순).
- 탭: **주간보고(read)** — 주차별 금주/차주 / **변경 이력** — 감사 로그 표.
- 수정: `ProjectFormDialog`(코드·정식명칭·유형·PM·기간·NAS·Git·소개 + 노출 체크 + 종료 체크), **저장 시 확인창**.

## 3. 종료 (`/closed`)
- 완료 처리된 프로젝트 목록(코드·명·유형·PM·기간).

## 4. 주간보고 (`/weekly`, MainPage)
- 월 네비 + (관리자)주차 추가. 주차 카드: 진행률 + (관리자) **수정(연필)·삭제(휴지통)**.
- 주차 상세: 좌측 멤버(직책순, 상태 색점) / 우측 전체취합(OverallReport) 또는 개인보고(PersonalReport).
- 주차 생성/수정 다이얼로그: 종료일<시작일 시 알럿.
- 개인보고: 프로젝트 슬롯 추가(진행중+주간보고노출만) → 금주/차주 작성 → 저장, 작성완료 토글.

## 5. 설정 (`/settings`, 3탭)
- **프로젝트 관리**: 목록(코드·명·유형·상태·노출·관리) + 등록/수정/삭제/팀원배정. 검색(구분자 선택: 전체·코드·명·유형·상태) + **10개 페이지네이션**, 완료는 맨 뒤. 하단 유형/상태 마스터.
- **인력 관리**: 계정 목록/생성/수정(아이디 변경 가능)/삭제/비번초기화. 직책 Select(센터장~대리), 소속. 퇴사자는 비활성.
- **시스템 관리**: 역할×권한 매트릭스(체크박스).

## API 클라이언트 (`api/`)
client, authApi, userApi, projectApi, metaApi, dashboardApi, weekApi, reportApi, permissionApi

## 스타일/테마
- Primary `#3B82F6`, 유형색 팔레트(코드 기반). 라이트/다크 테마(theme.ts), 하드코딩 배경은 테마 토큰(background.paper/default, divider, action.hover)로 정리.
- 대시보드/레이아웃은 다크모드 완전 대응. 일부 보고 화면은 하드코딩 색 잔존 가능(순차 정리).
