-- 001_schemas.sql
-- weekly_hub → ai_weekly_hub 통합: public 단일 스키마 → common(공유)/weekly(주간회의) 분리
-- 데이터 보존: ALTER TABLE ... SET SCHEMA (메타데이터 연산, FK 자동 유지)
-- 멱등하게 재실행 가능하도록 IF EXISTS / IF NOT EXISTS / ON CONFLICT 사용

BEGIN;

-- 1) 스키마 생성
CREATE SCHEMA IF NOT EXISTS common;
CREATE SCHEMA IF NOT EXISTS weekly;

-- 2) 기존 테이블 이동 (데이터 유지, 기존 FK 자동 승계)
ALTER TABLE IF EXISTS public.users          SET SCHEMA common;
ALTER TABLE IF EXISTS public.projects       SET SCHEMA common;
ALTER TABLE IF EXISTS public.weeks          SET SCHEMA weekly;
ALTER TABLE IF EXISTS public.reports        SET SCHEMA weekly;
ALTER TABLE IF EXISTS public.report_entries SET SCHEMA weekly;
-- public.role_permissions 는 미사용 → 이번 단계에서는 그대로 둔다.

-- 3) common.users 확장 (직책/소속). 기존 role(admin/user)은 전역역할로 유지.
ALTER TABLE common.users ADD COLUMN IF NOT EXISTS position VARCHAR(50);
ALTER TABLE common.users ADD COLUMN IF NOT EXISTS team     VARCHAR(50);

-- 4) 유형/상태 마스터 테이블
CREATE TABLE IF NOT EXISTS common.project_types (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
);
CREATE TABLE IF NOT EXISTS common.project_statuses (
    id         SERIAL PRIMARY KEY,
    name       VARCHAR(50) NOT NULL UNIQUE,
    sort_order INTEGER DEFAULT 0
);

-- 5) common.projects 확장
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS code        VARCHAR(50);
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS type_id     INTEGER REFERENCES common.project_types(id);
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS status_id   INTEGER REFERENCES common.project_statuses(id);
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS pm_user_id  INTEGER REFERENCES common.users(id);
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS start_date  DATE;
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS end_date    DATE;
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS nas_path    VARCHAR(300);
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS git_url     VARCHAR(300);
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP DEFAULT now();

-- 6) 프로젝트 구성원 (프로젝트별 PM/팀원)
CREATE TABLE IF NOT EXISTS common.project_members (
    id         SERIAL PRIMARY KEY,
    project_id INTEGER NOT NULL REFERENCES common.projects(id) ON DELETE CASCADE,
    user_id    INTEGER NOT NULL REFERENCES common.users(id)    ON DELETE CASCADE,
    role       VARCHAR(10) NOT NULL DEFAULT 'member',  -- pm | member
    UNIQUE (project_id, user_id)
);

-- 7) 감사 로그
CREATE TABLE IF NOT EXISTS common.project_logs (
    id            SERIAL PRIMARY KEY,
    project_id    INTEGER NOT NULL REFERENCES common.projects(id) ON DELETE CASCADE,
    actor_user_id INTEGER REFERENCES common.users(id),
    action        VARCHAR(100) NOT NULL,
    field         VARCHAR(50),
    old_value     TEXT,
    new_value     TEXT,
    created_at    TIMESTAMP DEFAULT now()
);

-- 8) 마스터 시드
INSERT INTO common.project_types (name, sort_order) VALUES
    ('PoC', 1), ('본사업', 2), ('연구개발', 3)
    ON CONFLICT (name) DO NOTHING;
INSERT INTO common.project_statuses (name, sort_order) VALUES
    ('진행중', 1), ('완료', 2)
    ON CONFLICT (name) DO NOTHING;

-- 9) 기존 프로젝트 백필: 상태=진행중, 코드=PRJ-000N (관리자 후속 편집)
UPDATE common.projects
   SET status_id = (SELECT id FROM common.project_statuses WHERE name = '진행중')
 WHERE status_id IS NULL;

UPDATE common.projects
   SET code = 'PRJ-' || LPAD(id::text, 4, '0')
 WHERE code IS NULL OR code = '';

-- 10) 코드 유니크 인덱스 (백필 후)
CREATE UNIQUE INDEX IF NOT EXISTS projects_code_key ON common.projects(code);

COMMIT;
