-- V4: Índices de performance para queries frequentes.
--
-- 1. subjects.user_id — a query findAllByUser filtra apenas por user_id; o índice
--    composto UNIQUE (user_id, client_id) não é aproveitado pelo planner nesse caso
--    porque a coluna está na segunda posição. Um índice dedicado resolve isso.
--
-- 2. password_reset_tokens.user_id — lookup de tokens por usuário (ex: listagem futura
--    e verificação de tokens pendentes).
--
-- 3. password_reset_tokens.expires_at — a query de limpeza periódica filtra por
--    expires_at < :now OR used = true; sem índice, faz full table scan na tabela de tokens.

CREATE INDEX IF NOT EXISTS idx_subjects_user_id
    ON subjects (user_id);

CREATE INDEX IF NOT EXISTS idx_prt_user_id
    ON password_reset_tokens (user_id);

CREATE INDEX IF NOT EXISTS idx_prt_expires_at
    ON password_reset_tokens (expires_at);
