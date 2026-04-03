-- Expand scores table for multi-module training results

ALTER TABLE scores
  ADD COLUMN IF NOT EXISTS module_id VARCHAR(50),
  ADD COLUMN IF NOT EXISTS accuracy NUMERIC(5,4),
  ADD COLUMN IF NOT EXISTS review_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_success BOOLEAN;

CREATE INDEX IF NOT EXISTS idx_scores_module_id ON scores(module_id);

UPDATE scores
SET
  module_id = COALESCE(module_id, 'word-memory'),
  accuracy = COALESCE(accuracy, 0),
  review_count = COALESCE(review_count, 0),
  metadata = COALESCE(metadata, '{}'::jsonb),
  is_success = COALESCE(is_success, true)
WHERE
  module_id IS NULL
  OR accuracy IS NULL
  OR review_count IS NULL
  OR metadata IS NULL
  OR is_success IS NULL;
