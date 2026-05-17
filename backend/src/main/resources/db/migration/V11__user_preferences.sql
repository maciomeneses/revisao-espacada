CREATE TABLE user_preferences (
    user_id             UUID                     PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    allowed_review_days SMALLINT[]               NOT NULL DEFAULT '{0,1,2,3,4,5,6}',
    created_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);
