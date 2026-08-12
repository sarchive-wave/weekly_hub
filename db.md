# Database Specification

DB의 단일 원천(single source of truth). 테이블/ERD/컬럼/인덱스/관계를 여기서만 관리한다.

## 개요

| 항목 | 값 |
|------|-----|
| DBMS | PostgreSQL |
| Database | `weekly_hub_db` |
| 사용자 | `sarchive` |
| 호스트/포트 | `localhost:5432` (네트워크 공유 시 `192.168.2.126`) |
| 접속 URL | `postgresql://sarchive:todo1234@localhost:5432/weekly_hub_db` |
| 사용 테이블 | `users`, `projects`, `weeks`, `reports`, `report_entries` (5개) |

> 스키마는 SQLAlchemy 모델에서 `Base.metadata.create_all(bind=engine)`로 자동 생성된다(앱 기동 시).
> 별도 마이그레이션 도구(Alembic 등)는 없다.

### ⚠️ 미사용 테이블 — `role_permissions`
DB에 `role_permissions` 테이블(및 데이터)이 존재하지만 **현재 코드(모델/서비스/라우터/프론트) 어디에서도 참조하지 않는다.** 제거된 권한 기능의 잔재로 추정. 드롭 여부는 별도 결정 필요(데이터 보존 상태).

---

## ERD

```
users (1) ───< reports >─── (1) weeks
                  │
                  │ (1)
                  ▼
             report_entries >─── (1) projects
```
- `reports` : (week, user) 조합당 1건 (UNIQUE)
- `report_entries` : (report, project) 조합당 1건 (UNIQUE)
- 모든 하위 관계는 **ON DELETE CASCADE**:
  주차 삭제 → 보고 삭제 → 엔트리 삭제 / 사용자 삭제 → 보고 삭제 / 프로젝트 삭제 → 엔트리 삭제

---

## users

| 컬럼 | 타입 | NULL | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NOT NULL | seq | PK |
| username | varchar(50) | NOT NULL | | **UNIQUE** |
| password_hash | varchar(255) | NOT NULL | | bcrypt 해시 |
| role | varchar(10) | NOT NULL | `'user'` | `admin` / `user` |
| display_name | varchar(50) | NOT NULL | | 표시 이름 |
| is_active | boolean | NOT NULL | `true` | 비활성 시 로그인/집계 제외 |
| sort_order | integer | NULL | `999` | 목록 정렬 |
| created_at | timestamp | NULL | `now()` | |
| updated_at | timestamp | NULL | `now()` | onupdate 갱신 |

인덱스: `users_pkey`(id), `users_username_key` UNIQUE(username)

---

## projects

| 컬럼 | 타입 | NULL | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NOT NULL | seq | PK |
| name | varchar(100) | NOT NULL | | **UNIQUE** |
| sort_order | integer | NULL | `999` | 목록/보고 정렬 |
| created_at | timestamp | NULL | `now()` | |

인덱스: `projects_pkey`(id), `projects_name_key` UNIQUE(name)

---

## weeks

| 컬럼 | 타입 | NULL | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NOT NULL | seq | PK |
| year | integer | NOT NULL | | |
| month | integer | NOT NULL | | |
| week_num | integer | NOT NULL | | 월 내 주차 번호 |
| title | varchar(50) | NOT NULL | | 예: "8월 2주차" |
| start_date | date | NULL | | 주차 시작(월) |
| end_date | date | NULL | | 주차 종료(금) |
| created_at | timestamp | NULL | `now()` | |

인덱스: `weeks_pkey`(id), `weeks_year_month_week_num_key` UNIQUE(year, month, week_num)

---

## reports

| 컬럼 | 타입 | NULL | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NOT NULL | seq | PK |
| week_id | integer | NOT NULL | | FK → weeks(id) CASCADE |
| user_id | integer | NOT NULL | | FK → users(id) CASCADE |
| status | varchar(10) | NOT NULL | `'none'` | `none` / `draft` / `done` |
| updated_at | timestamp | NULL | `now()` | onupdate 갱신 |

인덱스: `reports_pkey`(id), `reports_week_id_user_id_key` UNIQUE(week_id, user_id)

> 상태 흐름: 저장 시 `draft`, 작성완료 토글 시 `done`, 해제 시 `none`. 보고가 없으면 조회는 `none`+빈 목록 반환.

---

## report_entries

| 컬럼 | 타입 | NULL | 기본값 | 비고 |
|------|------|------|--------|------|
| id | integer | NOT NULL | seq | PK |
| report_id | integer | NOT NULL | | FK → reports(id) CASCADE |
| project_id | integer | NOT NULL | | FK → projects(id) CASCADE |
| current_work | text | NULL | `''` | 금주 업무 |
| next_work | text | NULL | `''` | 차주 업무 |

인덱스: `report_entries_pkey`(id), `report_entries_report_id_project_id_key` UNIQUE(report_id, project_id)

> 저장 시 해당 report의 기존 엔트리를 전부 삭제 후 재삽입한다(전체 교체 방식, `function.md` 참조).

---

## 초기 데이터 (seed)

`seed.py` — admin 역할 사용자가 하나도 없을 때만 아래 계정을 생성:

| username | password | role | display_name |
|----------|----------|------|--------------|
| admin | admin1234 (해시 저장) | admin | 관리자 |

projects/weeks/reports는 seed 없음(운영 중 생성).

---

## 참고 쿼리

```sql
-- 주차별 작성완료 인원
SELECT w.title, count(*) FILTER (WHERE r.status='done') AS done, count(u.*) AS total
FROM weeks w
CROSS JOIN users u
LEFT JOIN reports r ON r.week_id=w.id AND r.user_id=u.id
WHERE u.is_active
GROUP BY w.id ORDER BY w.year DESC, w.month DESC, w.week_num;

-- 특정 주차 취합 (프로젝트별 엔트리)
SELECT p.name, e.current_work, e.next_work
FROM report_entries e
JOIN reports r ON r.id=e.report_id
JOIN projects p ON p.id=e.project_id
WHERE r.week_id = :week_id;
```
