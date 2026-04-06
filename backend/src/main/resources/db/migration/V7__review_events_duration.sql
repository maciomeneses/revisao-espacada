ALTER TABLE review_events
    ADD COLUMN IF NOT EXISTS duration_seconds INT NOT NULL DEFAULT 0;
