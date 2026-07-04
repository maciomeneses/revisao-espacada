ALTER TABLE user_preferences
    ADD COLUMN max_reviews_per_day SMALLINT
        CONSTRAINT chk_user_preferences_max_reviews_per_day
        CHECK (max_reviews_per_day IS NULL OR max_reviews_per_day >= 1);
