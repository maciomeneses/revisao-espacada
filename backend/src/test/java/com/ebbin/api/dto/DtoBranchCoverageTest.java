package com.ebbin.api.dto;

import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewEvent;
import com.ebbin.api.model.UserPreferences;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Cobre branches de null-handling em DTOs e nas entidades correlatas que não são
 * exercitados pelos integration tests (necessário para a regra per-class do JaCoCo).
 */
@DisplayName("DTOs e entidades — branches de null-handling")
class DtoBranchCoverageTest {

    @Test
    @DisplayName("UserPreferencesDto.from com array null retorna lista vazia")
    void userPreferencesDto_fromNullArray() {
        UserPreferences prefs = new UserPreferences();
        prefs.setAllowedReviewDays(null);

        UserPreferencesDto dto = UserPreferencesDto.from(prefs);

        assertThat(dto.allowedReviewDays()).isEmpty();
    }

    @Test
    @DisplayName("UserPreferencesDto.from com array preenchido ordena os dias")
    void userPreferencesDto_fromPopulatedArray() {
        UserPreferences prefs = new UserPreferences();
        prefs.setAllowedReviewDays(new Short[] { (short) 5, (short) 0, (short) 3 });

        UserPreferencesDto dto = UserPreferencesDto.from(prefs);

        assertThat(dto.allowedReviewDays()).containsExactly(0, 3, 5);
    }

    @Test
    @DisplayName("ReviewEventDto.applyTo com durationSeconds null grava 0")
    void reviewEventDto_applyToWithNullDuration() {
        ReviewEventDto dto = new ReviewEventDto(
                null, "subj-1", "Subject 1",
                java.time.LocalDate.of(2026, 1, 1),
                PerformanceLevel.BOM.getValue(),
                1, 10, 80,
                null
        );
        ReviewEvent target = new ReviewEvent();
        target.setDurationSeconds(999);

        dto.applyTo(target);

        assertThat(target.getDurationSeconds()).isZero();
        assertThat(target.getPerformance()).isEqualTo(PerformanceLevel.BOM);
        assertThat(target.getSubjectId()).isEqualTo("subj-1");
    }

    @Test
    @DisplayName("ReviewEventDto.applyTo com durationSeconds preenchido grava o valor")
    void reviewEventDto_applyToWithDuration() {
        ReviewEventDto dto = new ReviewEventDto(
                42L, "subj-2", "Subject 2",
                java.time.LocalDate.of(2026, 2, 2),
                PerformanceLevel.EXCELENTE.getValue(),
                2, 20, 95,
                300
        );
        ReviewEvent target = new ReviewEvent();

        dto.applyTo(target);

        assertThat(target.getDurationSeconds()).isEqualTo(300);
    }

    @Test
    @DisplayName("ReviewEventDto.from constrói DTO equivalente")
    void reviewEventDto_fromEvent() {
        ReviewEvent e = new ReviewEvent();
        e.setSubjectId("c1");
        e.setSubjectName("Nome");
        e.setReviewDate(java.time.LocalDate.of(2026, 3, 3));
        e.setPerformance(PerformanceLevel.MEDIO);
        e.setReps(3);
        e.setQuestions(15);
        e.setAccuracy(70);
        e.setDurationSeconds(120);

        ReviewEventDto dto = ReviewEventDto.from(e);

        assertThat(dto.subjectId()).isEqualTo("c1");
        assertThat(dto.performance()).isEqualTo(PerformanceLevel.MEDIO.getValue());
        assertThat(dto.durationSeconds()).isEqualTo(120);
    }

    @Test
    @DisplayName("ReviewEvent.setPerformance(null) cai no fallback NAO_CLASSIFICADA")
    void reviewEvent_setPerformanceNullFallsBack() {
        ReviewEvent e = new ReviewEvent();
        e.setPerformance(PerformanceLevel.BOM);

        e.setPerformance(null);

        assertThat(e.getPerformance()).isEqualTo(PerformanceLevel.NAO_CLASSIFICADA);
    }
}
