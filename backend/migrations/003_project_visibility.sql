-- 003_project_visibility.sql
-- 프로젝트별 메뉴 노출 설정: 대시보드 / 주간회의 (기본 둘 다 노출)

BEGIN;

ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS show_in_dashboard BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE common.projects ADD COLUMN IF NOT EXISTS show_in_weekly    BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
