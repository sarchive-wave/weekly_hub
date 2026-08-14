# Database Specification

DB의 단일 원천(single source of truth). 테이블/ERD/컬럼/관계를 여기서만 관리한다.

## 개요

| 항목 | 값 |
|------|-----|
| DBMS | PostgreSQL |
| Database | `weekly_hub_db` |
| 접속 | `postgresql://sarchive:todo1234@localhost:5432/weekly_hub_db` |
| 스키마 | `common`(공유) / `weekly`(주간보고) / `public`(role_permissions) |

- SQLAlchemy 모델 기준 `create_all`로 신규 테이블 생성. 구조 변경은 `backend/migrations/00X_*.sql`을 **수기 실행**(Alembic 미사용). `deploy.md` 참조.

### 스키마 배치
- **common**: `users`, `projects`, `project_types`, `project_statuses`, `project_members`, `project_logs`, `user_project_order`
- **weekly**: `weeks`, `reports`, `report_entries` (→ common.users / common.projects FK 참조)
- **public**: `role_permissions` (권한 설정)

---

## ERD (요약)

```
common.users ─┬─< common.project_members >─┬─ common.projects ─┬─ project_types
              │                             │                  ├─ project_statuses
              ├─< common.user_project_order>┤                  ├─ (pm_user_id → users)
              ├─< common.project_logs >──────┘                 │
              └─< weekly.reports >── weekly.weeks               │
                     └─< weekly.report_entries >────────────────┘
```
- 모든 하위 관계 ON DELETE CASCADE. 프로젝트 삭제 → members/logs/order/report_entries 정리.

---

## common.users
계정 + 전역역할 + 직책/소속.

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | int PK | |
| username | varchar(50) UNIQUE | 로그인 아이디 |
| password_hash | varchar(255) | bcrypt |
| role | varchar(10) | 전역역할 `admin`/`user` |
| display_name | varchar(50) | 표시 이름 |
| position | varchar(50) | 직책(센터장/팀장/차장/과장/대리) |
| team | varchar(50) | 소속/팀 |
| is_active | bool | 비활성 시 로그인·집계 제외(퇴사자 처리) |
| sort_order | int | (표시는 직책순→가나다 규칙 우선, `function.md`) |
| created_at / updated_at | timestamp | |

## common.projects

| 컬럼 | 타입 | 비고 |
|------|------|------|
| id | int PK | |
| code | varchar(50) UNIQUE | 프로젝트 코드(영문 약칭 등) |
| name | varchar(100) UNIQUE | 프로젝트명 |
| full_name | varchar(200) | 정식 명칭(목록 미노출) |
| description | text | 소개 |
| type_id | int FK → project_types | 유형 |
| status_id | int FK → project_statuses | 상태 |
| pm_user_id | int FK → users | 대표 PM |
| start_date / end_date | date | 시작/마감예정 |
| nas_path | varchar(300) | NAS 공유폴더 |
| git_url | varchar(300) | Git 저장소 |
| show_in_dashboard | bool | 대시보드 노출 |
| show_in_weekly | bool | 주간보고 노출 |
| sort_order | int | (개인 순서는 user_project_order) |
| created_at / updated_at | timestamp | |

## common.project_types / project_statuses (마스터)
`id, name(UNIQUE), sort_order`
- types 시드: PoC / 본사업 / 연구개발 / 기획 / 기타
- statuses 시드: 진행중 / 완료

## common.project_members
프로젝트별 인력 배정. `id, project_id FK, user_id FK, role(pm|member)`, UNIQUE(project_id, user_id)

## common.project_logs (감사)
`id, project_id FK, actor_user_id FK, action, field, old_value, new_value, created_at`
- 마감일/상태/PM/팀원/필드 변경 기록.

## common.user_project_order (개인화)
사용자별 대시보드 표시 순서. `id, user_id FK, project_id FK, sort_order`, UNIQUE(user_id, project_id)
- 없으면 가나다(이름) 기본 정렬.

## public.role_permissions
역할별 권한 설정(시스템 관리). `id, role, permission, enabled`, UNIQUE(role, permission)
- 카탈로그(role: admin/pm/member, permission: project.create/edit/delete/member, week.manage, meta.manage, account.manage)는 코드(`permission_service`)에 정의, 저장은 이 테이블.

---

## weekly.weeks / reports / report_entries

- **weeks**: `id, year, month, week_num, title, start_date, end_date, created_at`, UNIQUE(year,month,week_num)
- **reports**: `id, week_id FK, user_id FK(common.users), status(none/draft/done), updated_at`, UNIQUE(week_id,user_id)
- **report_entries**: `id, report_id FK, project_id FK(common.projects), current_work text, next_work text`, UNIQUE(report_id,project_id)

> 저장 시 해당 report의 기존 엔트리를 전부 삭제 후 재삽입(전체 교체). `function.md` 참조.

---

## 초기 데이터 (seed / 마이그레이션)
- `seed.py`: admin 계정(`admin`/`admin1234`, role=admin) — admin 역할 없을 때만.
- 마스터(types/statuses)는 마이그레이션 001/004에서 시드.

## 마이그레이션 이력
| 파일 | 내용 |
|------|------|
| 001_schemas.sql | public→common/weekly 분리, 신규 테이블·시드·백필 |
| 002_user_project_order.sql | 개인 순서 테이블 |
| 003_project_visibility.sql | show_in_dashboard/weekly |
| 004_project_fullname_types.sql | full_name 컬럼 + 유형 기획/기타 |
| 005_user_participation.sql | users.in_dashboard/in_weekly (참여 설정) |
| 006_preserve_report_entries.sql | report_entries FK SET NULL + project_name 스냅샷(프로젝트 삭제해도 보고 보존) |
| 007_soft_delete.sql | weeks.is_deleted(주차 소프트 삭제) + 부분 유니크 인덱스 |

## 삭제/보존 정책 (soft delete)
- **프로젝트 삭제**: report_entries 보존(FK SET NULL, project_name 스냅샷). 화면·DB 모두 과거 보고 유지.
- **주차 삭제**: `weeks.is_deleted=true`(소프트). 화면에서만 제외, 주차·보고 데이터 보존. 관리자만 가능.
- **사용자 삭제**: `users.is_active=false`(소프트/비활성). 과거 보고 보존, 주간 멤버에 "(비활성)"으로 맨 아래 표시, 활성화로 복구.
