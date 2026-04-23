-- V10: introduz entidades Area e Discipline com ownership por usuário.
-- Subjects ganham FK opcional para Discipline (nullable nesta migration).
-- Backfill popula areas/disciplines a partir dos valores (area, modulo) já existentes
-- em subjects, e associa cada subject à sua discipline.

CREATE TABLE IF NOT EXISTS areas (
    id         BIGSERIAL    NOT NULL,
    user_id    UUID         NOT NULL,
    name       VARCHAR(120) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_areas PRIMARY KEY (id),
    CONSTRAINT uq_areas_user_name UNIQUE (user_id, name),
    CONSTRAINT fk_areas_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_areas_user_id ON areas (user_id);

CREATE TABLE IF NOT EXISTS disciplines (
    id         BIGSERIAL    NOT NULL,
    user_id    UUID         NOT NULL,
    area_id    BIGINT       NOT NULL,
    name       VARCHAR(120) NOT NULL,
    created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_disciplines PRIMARY KEY (id),
    CONSTRAINT uq_disciplines_user_area_name UNIQUE (user_id, area_id, name),
    CONSTRAINT fk_disciplines_user FOREIGN KEY (user_id)
        REFERENCES users (id) ON DELETE CASCADE,
    CONSTRAINT fk_disciplines_area FOREIGN KEY (area_id)
        REFERENCES areas (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_disciplines_user_id ON disciplines (user_id);
CREATE INDEX IF NOT EXISTS idx_disciplines_area_id ON disciplines (area_id);

-- Subjects: FK opcional para discipline. ON DELETE CASCADE garante que excluir
-- uma disciplina também apaga seus subjects (comportamento esperado do CRUD).
ALTER TABLE subjects
    ADD COLUMN IF NOT EXISTS discipline_id BIGINT;

ALTER TABLE subjects
    DROP CONSTRAINT IF EXISTS fk_subjects_discipline;

ALTER TABLE subjects
    ADD CONSTRAINT fk_subjects_discipline FOREIGN KEY (discipline_id)
        REFERENCES disciplines (id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_subjects_discipline_id ON subjects (discipline_id);

-- Backfill 1: cria áreas a partir de valores distintos de subjects.area.
INSERT INTO areas (user_id, name)
SELECT DISTINCT s.user_id, s.area
FROM subjects s
WHERE s.area IS NOT NULL AND TRIM(s.area) <> ''
ON CONFLICT (user_id, name) DO NOTHING;

-- Backfill 2: cria disciplinas a partir de (area, modulo) distintos em subjects.
INSERT INTO disciplines (user_id, area_id, name)
SELECT DISTINCT s.user_id, a.id, s.modulo
FROM subjects s
JOIN areas a ON a.user_id = s.user_id AND a.name = s.area
WHERE s.modulo IS NOT NULL AND TRIM(s.modulo) <> ''
ON CONFLICT (user_id, area_id, name) DO NOTHING;

-- Backfill 3: associa discipline_id nos subjects existentes.
UPDATE subjects s
SET discipline_id = d.id
FROM disciplines d
JOIN areas a ON a.id = d.area_id
WHERE d.user_id = s.user_id
  AND a.name = s.area
  AND d.name = s.modulo
  AND s.discipline_id IS NULL;

-- Seed ENEM baseline: garante as 4 áreas e disciplinas oficiais para TODOS os usuários
-- existentes. ON CONFLICT DO NOTHING preserva categorias customizadas já presentes.
INSERT INTO areas (user_id, name)
SELECT u.id, a.name
FROM users u
CROSS JOIN (VALUES
    ('Ciências da Natureza'),
    ('Matemática e suas Tecnologias'),
    ('Ciências Humanas'),
    ('Linguagens e Códigos')
) AS a(name)
ON CONFLICT (user_id, name) DO NOTHING;

INSERT INTO disciplines (user_id, area_id, name)
SELECT a.user_id, a.id, d.name
FROM areas a
JOIN (VALUES
    ('Ciências da Natureza',          'Biologia'),
    ('Ciências da Natureza',          'Física'),
    ('Ciências da Natureza',          'Química'),
    ('Matemática e suas Tecnologias', 'Matemática'),
    ('Ciências Humanas',              'Filosofia'),
    ('Ciências Humanas',              'Geografia'),
    ('Ciências Humanas',              'História'),
    ('Ciências Humanas',              'Sociologia'),
    ('Linguagens e Códigos',          'Linguagens')
) AS d(area_name, name) ON d.area_name = a.name
ON CONFLICT (user_id, area_id, name) DO NOTHING;
