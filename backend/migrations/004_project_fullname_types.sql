-- 004_project_fullname_types.sql
-- 프로젝트 정식명칭(full_name) 컬럼 + 유형 '기획','기타' 추가

BEGIN;

ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS full_name VARCHAR(200);

INSERT INTO common.project_types (name, sort_order) VALUES
    ('기획', 4), ('기타', 9)
    ON CONFLICT (name) DO NOTHING;

COMMIT;
