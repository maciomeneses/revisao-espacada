-- Adiciona o campo accuracy (0–100) para armazenar o percentual real de acertos.
-- Valor padrão 0 para compatibilidade com linhas existentes.

ALTER TABLE review_events
    ADD COLUMN IF NOT EXISTS accuracy SMALLINT NOT NULL DEFAULT 0;
