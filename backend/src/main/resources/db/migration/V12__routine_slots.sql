CREATE TABLE routine_slot (
    id           UUID                     PRIMARY KEY,
    user_id      UUID                     NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    client_id    VARCHAR(64)              NOT NULL,
    day_of_week  SMALLINT                 NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    slot_type    VARCHAR(16)              NOT NULL,
    area         VARCHAR(128),
    title        VARCHAR(255),
    start_time   VARCHAR(8),
    end_time     VARCHAR(8),
    created_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, client_id)
);
CREATE INDEX idx_routine_slot_user_id ON routine_slot(user_id);
