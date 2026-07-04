-- V14: Auto-cadastro público com verificação de e-mail (issue #59).
-- users.email_verified: contas pré-existentes (criadas por ADMIN) permanecem
-- verificadas (DEFAULT TRUE); contas de self-signup nascem com FALSE e só podem
-- logar após confirmar o e-mail.
-- email_verification_tokens: tokens de uso único, mesmo padrão de V3
-- (password_reset_tokens).

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT TRUE;

CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id         UUID         NOT NULL DEFAULT gen_random_uuid(),
    user_id    UUID         NOT NULL,
    token      VARCHAR(36)  NOT NULL,
    expires_at TIMESTAMP    NOT NULL,
    used       BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP    NOT NULL DEFAULT now(),
    CONSTRAINT pk_email_verification_tokens PRIMARY KEY (id),
    CONSTRAINT uq_email_verification_tokens_token UNIQUE (token),
    CONSTRAINT fk_email_verification_tokens_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token
    ON email_verification_tokens (token);

-- Suporte à purga periódica de contas não verificadas (TokenCleanupService).
CREATE INDEX IF NOT EXISTS idx_users_email_verified_created_at
    ON users (email_verified, created_at);
