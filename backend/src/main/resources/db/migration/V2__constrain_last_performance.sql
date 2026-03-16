-- V2: Restringe last_performance aos valores válidos do enum PerformanceLevel.
-- A coluna já era VARCHAR(50); este migration adiciona um CHECK CONSTRAINT para
-- garantir integridade referencial no nível do banco, prevenindo valores arbitrários.
-- Valores existentes nulos ou dentro do domínio do enum não são afetados.

ALTER TABLE subjects
    ADD CONSTRAINT chk_last_performance
    CHECK (last_performance IS NULL
        OR last_performance IN ('nao_classificada', 'ruim', 'medio', 'bom', 'excelente'));
