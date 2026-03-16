package com.ebbin.api.dto;

import com.ebbin.api.model.Subject;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record SubjectDto(
    @NotBlank String id,
    @NotBlank String modulo,
    @NotBlank String area,
    @NotBlank String aulaPrincipal,
    @NotBlank String relevancia,
    boolean aulaAssistida,
    boolean preAulaFeita,
    boolean flashcardsFeitos,
    boolean fixacao24hFeita,
    boolean estudoReversoFeito,
    boolean rev7dFeita,
    boolean rev30dFeita,
    boolean rev60dFeita,
    boolean rev90dFeita,
    @NotBlank String currentStage,
    LocalDate nextReviewDate,
    LocalDate lastReviewDate,
    String lastPerformance,
    @NotBlank String performanceLevel
) {
    public static SubjectDto from(Subject s) {
        return new SubjectDto(
            s.getClientId(), s.getModulo(), s.getArea(), s.getAulaPrincipal(),
            s.getRelevancia(), s.isAulaAssistida(), s.isPreAulaFeita(),
            s.isFlashcardsFeitos(), s.isFixacao24hFeita(), s.isEstudoReversoFeito(),
            s.isRev7dFeita(), s.isRev30dFeita(), s.isRev60dFeita(), s.isRev90dFeita(),
            s.getCurrentStage(), s.getNextReviewDate(), s.getLastReviewDate(),
            s.getLastPerformance(), s.getPerformanceLevel()
        );
    }

    public void applyTo(Subject s) {
        s.setClientId(this.id());
        s.setModulo(this.modulo());
        s.setArea(this.area());
        s.setAulaPrincipal(this.aulaPrincipal());
        s.setRelevancia(this.relevancia());
        s.setAulaAssistida(this.aulaAssistida());
        s.setPreAulaFeita(this.preAulaFeita());
        s.setFlashcardsFeitos(this.flashcardsFeitos());
        s.setFixacao24hFeita(this.fixacao24hFeita());
        s.setEstudoReversoFeito(this.estudoReversoFeito());
        s.setRev7dFeita(this.rev7dFeita());
        s.setRev30dFeita(this.rev30dFeita());
        s.setRev60dFeita(this.rev60dFeita());
        s.setRev90dFeita(this.rev90dFeita());
        s.setCurrentStage(this.currentStage());
        s.setNextReviewDate(this.nextReviewDate());
        s.setLastReviewDate(this.lastReviewDate());
        s.setLastPerformance(this.lastPerformance());
        s.setPerformanceLevel(this.performanceLevel());
    }
}
