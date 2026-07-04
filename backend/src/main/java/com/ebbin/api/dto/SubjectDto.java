package com.ebbin.api.dto;

import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewStage;
import com.ebbin.api.model.Subject;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

/**
 * DTO de Subject que expõe {@code currentStage} e {@code performanceLevel} como String
 * para manter compatibilidade com o contrato JSON do frontend, convertendo para enums
 * internamente via {@link ReviewStage#fromValue} e {@link PerformanceLevel#fromValue}.
 */
public record SubjectDto(
    @NotBlank String id,
    @NotBlank String modulo,
    @NotBlank String area,
    @NotBlank String aulaPrincipal,
    @NotBlank String relevancia,
    // Flags como Boolean (wrapper), não boolean: o frontend omite os flags legados
    // ao criar um subject novo, e o Jackson 3 rejeita null/ausente em primitivo
    // (FAIL_ON_NULL_FOR_PRIMITIVES) — quebrava o "Registrar Estudo" com 500.
    // Flag ausente = false (ver applyTo).
    Boolean aulaAssistida,
    Boolean preAulaFeita,
    Boolean flashcardsFeitos,
    Boolean fixacao24hFeita,
    Boolean estudoReversoFeito,
    Boolean rev7dFeita,
    Boolean rev30dFeita,
    Boolean rev60dFeita,
    Boolean rev90dFeita,
    @NotBlank String currentStage,
    LocalDate nextReviewDate,
    LocalDate lastReviewDate,
    /** Valor serializado do {@link PerformanceLevel} da última revisão, ou null se ainda não avaliado. */
    String lastPerformance,
    @NotBlank String performanceLevel,
    /** Estado FSRS (nullable: subject nunca revisado não tem estado). */
    Double stability,
    Double difficulty,
    Integer reps,
    Integer lapses,
    String state,
    Integer scheduledDays
) {
    /** Constrói um DTO a partir de uma entidade, serializando os enums para seus valores de String. */
    public static SubjectDto from(Subject s) {
        PerformanceLevel lp = s.getLastPerformance();
        return new SubjectDto(
            s.getClientId(), s.getModulo(), s.getArea(), s.getAulaPrincipal(),
            s.getRelevancia(), s.isAulaAssistida(), s.isPreAulaFeita(),
            s.isFlashcardsFeitos(), s.isFixacao24hFeita(), s.isEstudoReversoFeito(),
            s.isRev7dFeita(), s.isRev30dFeita(), s.isRev60dFeita(), s.isRev90dFeita(),
            s.getCurrentStage().getValue(),
            s.getNextReviewDate(), s.getLastReviewDate(),
            lp != null ? lp.getValue() : null,
            s.getPerformanceLevel().getValue(),
            s.getStability(), s.getDifficulty(), s.getReps(), s.getLapses(),
            s.getState(), s.getScheduledDays()
        );
    }

    /** Aplica os campos do DTO à entidade, convertendo Strings para enums com fallback seguro. */
    public void applyTo(Subject s) {
        s.setClientId(this.id());
        s.setModulo(this.modulo());
        s.setArea(this.area());
        s.setAulaPrincipal(this.aulaPrincipal());
        s.setRelevancia(this.relevancia());
        s.setAulaAssistida(flag(this.aulaAssistida()));
        s.setPreAulaFeita(flag(this.preAulaFeita()));
        s.setFlashcardsFeitos(flag(this.flashcardsFeitos()));
        s.setFixacao24hFeita(flag(this.fixacao24hFeita()));
        s.setEstudoReversoFeito(flag(this.estudoReversoFeito()));
        s.setRev7dFeita(flag(this.rev7dFeita()));
        s.setRev30dFeita(flag(this.rev30dFeita()));
        s.setRev60dFeita(flag(this.rev60dFeita()));
        s.setRev90dFeita(flag(this.rev90dFeita()));
        s.setCurrentStage(ReviewStage.fromValue(this.currentStage()));
        s.setNextReviewDate(this.nextReviewDate());
        s.setLastReviewDate(this.lastReviewDate());
        // Converte String para enum; null permanece null (sem revisão avaliada)
        s.setLastPerformance(this.lastPerformance() != null
                ? PerformanceLevel.fromValue(this.lastPerformance())
                : null);
        s.setPerformanceLevel(PerformanceLevel.fromValue(this.performanceLevel()));
        s.setStability(this.stability());
        s.setDifficulty(this.difficulty());
        s.setReps(this.reps());
        s.setLapses(this.lapses());
        s.setState(this.state());
        s.setScheduledDays(this.scheduledDays());
    }

    /** Flag ausente ou null no JSON equivale a false. */
    private static boolean flag(Boolean value) {
        return Boolean.TRUE.equals(value);
    }
}
