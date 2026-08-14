-- 007_soft_delete.sql
-- 주차 소프트 삭제: is_deleted 플래그. 삭제해도 주차·주간보고 데이터는 DB에 보존.
-- (사용자 소프트 삭제는 기존 is_active 컬럼 재사용 — 별도 DDL 불필요)

BEGIN;

ALTER TABLE weekly.weeks ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- (year,month,week_num) 고유 제약을 '삭제되지 않은 주차'에만 적용 → 삭제 후 동일 주차 재생성 허용
ALTER TABLE weekly.weeks DROP CONSTRAINT IF EXISTS weeks_year_month_week_num_key;
CREATE UNIQUE INDEX IF NOT EXISTS weeks_ymw_active_uniq
  ON weekly.weeks (year, month, week_num) WHERE is_deleted = false;

COMMIT;
