# AI Weekly Hub — 통합 서비스 설계서 (확정본 v1)

프로젝트 대시보드 + 주간회의를 **하나의 서비스**로 묶는다. 이 문서는 구현 착수 전 확정 설계다.

## 0. 확정 결정

| 항목 | 결정 |
|---|---|
| 구성 | 단일 서비스·단일 디렉토리(`ai_weekly_hub`). 대시보드/프로젝트관리 + 주간회의 두 축 |
| DB | PostgreSQL 1개 + **스키마 분리** (`common` 공유 / `weekly` 주간회의) |
| 프로젝트 마스터 | **단일** (`common.projects`). 주간보고가 이 프로젝트를 참조 |
| 프로젝트 생성 | **관리자만** |
| 상태 | `진행중` / `완료` — 완료 시 대시보드에서 빠지고 **"종료" 메뉴로 이관** |
| 유형 | **PoC / 본사업 / 연구개발** |
| 권한 | 전역(관리자/일반) + **프로젝트별(PM/팀원)** |
| 주간회의 연동 | 프로젝트 상세에서 해당 프로젝트의 주간진행을 **읽기 전용(read)** 표시. 작성은 주간회의 메뉴에서만 |

---

## 1. 관계 요약

- 대시보드/프로젝트 관리와 주간회의는 **나란한 두 축**. 프로젝트 상세는 주간 데이터를 **read-only 참조**만 한다.
- 한 사람(user)이 여러 프로젝트에 배정될 수 있고, 프로젝트마다 역할(PM/팀원)이 다를 수 있다.
- 사용자·프로젝트는 `common` 스키마에서 단일 관리 → 주간회의가 이를 공유한다.

---

## 2. DB 설계

> 다이어그램 원본: `design/erd.mmd` (FigJam에 Mermaid로 붙여넣기)

### 스키마 배치
- **common**: `users`, `projects`, `project_types`, `project_statuses`, `project_members`, `project_logs`
- **weekly**: `weeks`, `reports`, `report_entries`
  - `weekly.reports.user_id` → `common.users.id`
  - `weekly.report_entries.project_id` → `common.projects.id`
  - (동일 DB 내 스키마 간 FK이므로 참조 무결성 보장)

### 주요 테이블 요지
- **users**: 계정 + 전역역할(admin/user) + 직책(position)·소속(team)
- **projects**: 코드(UK)·이름·소개·유형·상태·PM·시작/마감일·NAS 경로·Git URL
- **project_types**: PoC / 본사업 / 연구개발 (마스터, 관리자 관리)
- **project_statuses**: 진행중 / 완료 (마스터)
- **project_members**: (project, user) 배정 + role(pm/member), UNIQUE(project_id, user_id)
- **project_logs**: 감사 로그 — actor·field·old→new·시각
- **weeks / reports / report_entries**: 기존 weekly_hub 구조 유지, 단 `report_entries`가 `common.projects` 참조

### 기존 weekly_hub → 이관
- 기존 weekly_hub의 자체 `projects` → `common.projects`로 **통합 이관**(중복 제거).
- 기존 `users` → `common.users`로 이관 + 컬럼 확장(position, team, global_role 정리).
- 미사용 `role_permissions` 테이블은 권한 관리 정책 확정 시 재설계/정리.

---

## 3. 메뉴 구조

```
[대시보드]      전체 프로젝트 현황(명·코드·PM·팀원·상태) 카드/표 시각화 — 진행중 중심
[프로젝트]      목록 → 상세(소개·유형·기간·NAS·Git·진행사항 + 주간진행 read + 변경이력)
[종료]          완료(종료)된 프로젝트 아카이브 뷰
[주간회의]      (기존) 개인 주간업무 작성 — 별개 축
[설정]
 ├ 프로젝트 관리 : 등록(관리자)·수정 / 코드 / 상태관리 / 유형관리
 ├ 인력 관리     : 등록·수정 / 직책 / 소속·팀 / 프로젝트별 배정(PM·팀원)
 └ 시스템 관리   : 사용자 관리 / 권한 관리
```

---

## 4. 권한 매트릭스

| 기능 | 관리자 | PM(담당) | 팀원 |
|---|:--:|:--:|:--:|
| 대시보드·프로젝트·종료 조회 | ✅ | ✅ | ✅ |
| 프로젝트 상세 주간진행 read | ✅ | ✅ | ✅ |
| **프로젝트 생성** | ✅ | ❌ | ❌ |
| 프로젝트 수정·상태·마감일 변경 | ✅ | ✅(담당) | ❌ |
| 완료 처리(종료 이관) | ✅ | ✅(담당) | ❌ |
| 팀원 배정 | ✅ | ✅(담당) | ❌ |
| 유형/상태/코드 마스터 관리 | ✅ | ❌ | ❌ |
| 인력·사용자·권한 관리 | ✅ | ❌ | ❌ |
| 본인 주간보고 작성 | ✅ | ✅ | ✅ |
| 주차 생성/삭제 | ✅ | ❌ | ❌ |

- 전역 관리자 = `users.global_role='admin'`. PM/팀원 = `project_members.role`.
- PM 권한은 **자신이 PM으로 배정된 프로젝트에 한정**.

---

## 5. 프로젝트 라이프사이클

```
[등록: 관리자]  →  status = 진행중  →  (완료 처리)  →  status = 완료
   대시보드 노출        대시보드 노출              "종료" 메뉴로 이관(대시보드에서 제외)
```
- 상태·마감일·PM·팀원 변경 시 `project_logs`에 필드 단위로 기록(누가·언제·무엇을 old→new).
- "종료" 메뉴 = `status = 완료` 필터 뷰. (필요 시 재개 = 완료→진행중 되돌리기, 이 역시 로그)

---

## 6. 감사 로그 (project_logs)

- 대상 이벤트(기본): 마감일(end_date) 변경, 상태 변경, PM 변경, 팀원 배정/해제, 주요 필드 수정.
- 기록: `project_id, actor_user_id, action, field, old_value, new_value, created_at`.
- 노출: 프로젝트 상세의 "변경 이력" 탭.

---

## 7. 유스케이스

> 다이어그램 원본: `design/usecase.mmd` (FigJam에 Mermaid로 붙여넣기)

- **관리자**: 프로젝트 등록/전권 관리, 유형·상태·코드 마스터, 인력·사용자·권한, 전체 조회, 주차 관리
- **PM**: 담당 프로젝트 수정·상태/마감 변경·완료 처리, 팀원 배정, 진행/취합 조회, 본인 주간보고
- **팀원**: 대시보드·프로젝트·주간진행 조회(read), 본인 주간보고 작성

---

## 8. 기술 스택(계승)

- Backend: FastAPI + SQLAlchemy 2.0 + Pydantic v2 + PostgreSQL, JWT 인증
- Frontend: React + TypeScript + Vite + MUI
- 기존 weekly_hub 코드 자산을 `weekly` 도메인으로 계승, `common`/`dashboard` 도메인 신규.

---

## 9. FigJam 사용 방법

1. FigJam 파일 열기 → 상단 툴바 `+`(또는 단축) → **Diagram** → **Mermaid** 선택
2. `design/erd.mmd` 내용 붙여넣기 → DB ERD가 편집 가능한 도형으로 생성
3. `design/usecase.mmd` 내용 붙여넣기 → 유스케이스 맵 생성
4. (선택) dbdiagram.io DSL 버전이 필요하면 요청 — 별도 생성 가능

---

## 10. 미확정/추후 결정 (TBD)

- 프로젝트 상세 "진행사항" 데이터 모델(주간보고 참조 외 별도 마일스톤/이슈 필요 여부)
- 권한 관리 화면의 세분화 수준(role_permissions 재활용 범위)
- `ai_weekly_hub` 착수 방식: 기존 `weekly_hub` 디렉토리 확장 vs 신규 구성 후 코드 이관 (구현 단계 확정)
