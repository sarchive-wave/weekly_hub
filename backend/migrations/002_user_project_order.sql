-- 002_user_project_order.sql
-- 사용자별 프로젝트 표시 순서(개인화). 없으면 가나다 기본.

BEGIN;

CREATE TABLE IF NOT EXISTS common.user_project_order (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES common.users(id)    ON DELETE CASCADE,
    project_id INTEGER NOT NULL REFERENCES common.projects(id) ON DELETE CASCADE,
    sort_order INTEGER NOT NULL,
    UNIQUE (user_id, project_id)
);

COMMIT;
