-- 006_preserve_report_entries.sql
-- 프로젝트 삭제 시 과거 주간보고 항목(report_entries)을 보존.
-- report_entries.project_id FK: ON DELETE CASCADE → SET NULL, 프로젝트명 스냅샷 컬럼 추가.

BEGIN;

-- 1) 프로젝트명 스냅샷 컬럼 + 기존 데이터 백필
ALTER TABLE weekly.report_entries ADD COLUMN IF NOT EXISTS project_name VARCHAR(100);
UPDATE weekly.report_entries e
   SET project_name = p.name
  FROM common.projects p
 WHERE e.project_id = p.id AND e.project_name IS NULL;

-- 2) project_id nullable + FK를 SET NULL로 재설정
ALTER TABLE weekly.report_entries ALTER COLUMN project_id DROP NOT NULL;
ALTER TABLE weekly.report_entries DROP CONSTRAINT IF EXISTS report_entries_project_id_fkey;
ALTER TABLE weekly.report_entries
  ADD CONSTRAINT report_entries_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES common.projects(id) ON DELETE SET NULL;

COMMIT;
