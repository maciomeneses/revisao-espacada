-- Tabela de histórico de revisões por assunto.
-- Cada linha representa uma revisão concluída; o campo `reps` registra quantas
-- revisões o assunto acumulou após esse evento, permitindo identificar a primeira
-- revisão de cada assunto (reps = 1) para o gráfico de "Assuntos novos".
-- Não há FK para subjects porque o histórico deve sobreviver à remoção de um assunto.

CREATE TABLE IF NOT EXISTS review_events (
    id           BIGSERIAL    NOT NULL,
    user_id      UUID         NOT NULL,
    subject_id   VARCHAR(255) NOT NULL,
    subject_name VARCHAR(500) NOT NULL,
    review_date  DATE         NOT NULL,
    performance  VARCHAR(20)  NOT NULL,
    reps         INT          NOT NULL DEFAULT 1,
    questions    INT          NOT NULL DEFAULT 10,
    created_at   TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_review_events PRIMARY KEY (id),
    CONSTRAINT fk_review_events_user
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Índice composto para consultas filtradas por usuário num intervalo de datas.
CREATE INDEX IF NOT EXISTS idx_review_events_user_date
    ON review_events (user_id, review_date);
