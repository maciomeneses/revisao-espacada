-- V15: Persistir o estado do algoritmo FSRS por subject.
--
-- Até aqui apenas next_review_date/last_review_date eram persistidos; o estado
-- de memória do FSRS (stability, difficulty, reps, lapses, state,
-- scheduled_days) vivia só no cliente e era perdido a cada recarga — toda
-- revisão voltava a ser tratada como primeira revisão e os intervalos nunca
-- cresciam. Todas as colunas são NULLABLE: subject nunca revisado não tem
-- estado FSRS.

ALTER TABLE subjects ADD COLUMN IF NOT EXISTS stability      DOUBLE PRECISION;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS difficulty     DOUBLE PRECISION;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS reps           INTEGER;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS lapses         INTEGER;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS state          VARCHAR(20);
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS scheduled_days INTEGER;
