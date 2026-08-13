-- 005_user_participation.sql
-- 사용자별 참여 설정: 대시보드(PM/팀원 대상)/주간보고(작성 대상). 기본 둘 다 참여.

BEGIN;

ALTER TABLE common.users ADD COLUMN IF NOT EXISTS in_dashboard BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE common.users ADD COLUMN IF NOT EXISTS in_weekly    BOOLEAN NOT NULL DEFAULT TRUE;

COMMIT;
