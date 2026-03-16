-- V1: Schema inicial gerado a partir do estado atual do Hibernate (ddl-auto: update).
-- Serve como baseline para o Flyway gerenciar migrações futuras em produção.
-- O perfil "prod" usa baseline-on-migrate: true, portanto bancos existentes já com o schema
-- serão marcados automaticamente na versão 1 sem re-executar este script.

CREATE TABLE IF NOT EXISTS users (
    id          UUID         NOT NULL DEFAULT gen_random_uuid(),
    email       VARCHAR(255) NOT NULL,
    password    VARCHAR(255) NOT NULL,
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at  TIMESTAMP,
    updated_at  TIMESTAMP,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_email UNIQUE (email)
);

CREATE TABLE IF NOT EXISTS subjects (
    id                   BIGSERIAL    NOT NULL,
    client_id            VARCHAR(255) NOT NULL,
    user_id              UUID         NOT NULL,
    modulo               VARCHAR(255) NOT NULL,
    area                 VARCHAR(255) NOT NULL,
    aula_principal       VARCHAR(255) NOT NULL,
    relevancia           VARCHAR(50)  NOT NULL,
    aula_assistida       BOOLEAN      NOT NULL DEFAULT FALSE,
    pre_aula_feita       BOOLEAN      NOT NULL DEFAULT FALSE,
    flashcards_feitos    BOOLEAN      NOT NULL DEFAULT FALSE,
    fixacao24h_feita     BOOLEAN      NOT NULL DEFAULT FALSE,
    estudo_reverso_feito BOOLEAN      NOT NULL DEFAULT FALSE,
    rev7d_feita          BOOLEAN      NOT NULL DEFAULT FALSE,
    rev30d_feita         BOOLEAN      NOT NULL DEFAULT FALSE,
    rev60d_feita         BOOLEAN      NOT NULL DEFAULT FALSE,
    rev90d_feita         BOOLEAN      NOT NULL DEFAULT FALSE,
    current_stage        VARCHAR(20)  NOT NULL DEFAULT 'aula',
    next_review_date     DATE,
    last_review_date     DATE,
    last_performance     VARCHAR(50),
    performance_level    VARCHAR(20)  NOT NULL DEFAULT 'nao_classificada',
    created_at           TIMESTAMP,
    updated_at           TIMESTAMP,
    CONSTRAINT pk_subjects PRIMARY KEY (id),
    CONSTRAINT uq_subjects_user_client UNIQUE (user_id, client_id),
    CONSTRAINT fk_subjects_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);
