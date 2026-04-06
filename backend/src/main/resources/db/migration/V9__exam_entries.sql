CREATE TABLE exam_entries (
    id            BIGSERIAL    PRIMARY KEY,
    user_id       BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    exam_date     DATE         NOT NULL,
    exam_name     VARCHAR(255) NOT NULL,
    exam_type     VARCHAR(100),
    score_percent SMALLINT     NOT NULL DEFAULT 0,
    notes         TEXT,
    created_at    TIMESTAMP WITHOUT TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_exam_entries_user ON exam_entries (user_id);
