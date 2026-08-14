# Frontend UI/UX Specification

## 기술 스택
- React 19 + TypeScript + Vite, MUI v5 + @mui/icons-material
- React Router v7, axios(`api/client.ts`, **baseURL = `import.meta.env.VITE_API_BASE ?? ''`** — 상대경로 기본, Vite dev 프록시 `/api`→8081). 하드코딩 URL 없음.
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
- **주간 진행(read)** 패널 — 주차별 금주/차주. (기존 "변경 이력" 탭은 **설정 > 관리이력**으로 이관.)
- 수정: `ProjectFormDialog`(코드·정식명칭·유형·PM·기간·NAS·Git·소개 + 노출 체크 + 종료 체크), **저장 시 확인창**. PM/팀원 선택은 `(활성&대시보드참여) || 현재값`만.

## 3. 종료 (`/closed`)
- 완료 처리된 프로젝트 목록(코드·명·유형·PM·기간).

## 4. 주간보고 (`/weekly`, MainPage)
- 월 네비 + (관리자)주차 추가. 주차 카드: 진행률 + (관리자) **수정(연필)·삭제(휴지통, 소프트)**. **주차별 색상**(`WEEK_PALETTE[(week_num-1)%len]`)으로 액센트바/제목/진행률 구분.
- 주차 상세: 좌측 멤버(직책순, 상태 색점, 비활성은 `(비활성)`) / 우측 전체취합(OverallReport) 또는 개인보고(PersonalReport).
- 주차 생성/수정 다이얼로그: 종료일<시작일 시 알럿.
- 개인보고(PersonalReport): 헤더 `[프로젝트 추가][작성완료][저장]`(저장은 작성완료 오른쪽), 슬림한 프로젝트 선택 헤더 + 컴팩트 카드. 프로젝트 슬롯 = 진행중+주간보고노출만.
  - **본인만 작성/수정 가능**(`canEdit = user.id === userId`). 타인 보고는 read-only. **관리자는 작성 멤버에 미노출**.
  - 읽기 전용 카드는 프로젝트 삭제 시 스냅샷명(`project?.name ?? entry.project_name`) 폴백.

## 5. 설정 (`/settings`, **5탭**)
- **프로젝트 관리**: 목록(코드·명·유형·상태·노출·관리) + 등록/수정/삭제/팀원배정. 검색(구분자 선택: 전체·코드·명·유형·상태) + **10개 페이지네이션**, 완료는 맨 뒤.
- **유형·상태 관리**(MasterTab): 유형(PoC/본사업/연구개발/기획/기타)·상태 마스터 CRUD.
- **인력 관리**(AccountTab): 계정 목록/생성/수정(아이디 변경 가능)/비번초기화. 직책 Select(센터장~대리), 소속, **참여 체크(대시보드/주간보고)**. 삭제=**비활성화(소프트)**+데이터 보존 안내, 비활성 계정은 **활성화** 버튼으로 복구, 맨 아래 표시.
- **시스템 관리**(PermissionTab): 역할×권한 매트릭스(체크박스) + **[저장] 버튼**(변경 추적)·"저장되었습니다" 알럿.
- **관리이력**(ProjectLogTab, 신규): 좌측 프로젝트 선택 → 우측 감사 로그 테이블(관리자 전용).

## 로그인 (`/login`)
- 배경 검정(`#000`), 카드만 라이트 테마 강제. 한글 부제 제거, 입력은 placeholder 사용(자동완성 라벨 겹침 방지).

## API 클라이언트 (`api/`)
client, authApi, userApi, projectApi, metaApi, dashboardApi, weekApi, reportApi, permissionApi

## 스타일/테마
- Primary `#3B82F6`, 유형색 팔레트(코드 기반). 라이트/다크 테마(theme.ts), 배경/구분선은 테마 토큰(background.paper/default, divider, action.hover)로 통일.
- 대시보드/레이아웃/주간보고 다크모드 대응. 주간보고는 주차별 색상 액센트로 모노톤 완화.
