package com.ebbin.api.dto;

import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewEvent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

/**
 * DTO de {@link ReviewEvent} usado para transferência entre frontend e backend.
 *
 * <p>{@code performance} é serializado como String (valor do enum) para manter
 * o mesmo contrato JSON que o frontend já usa em {@link SubjectDto}.
 */
public record ReviewEventDto(
    Long id,
    @NotBlank String subjectId,
    @NotBlank String subjectName,
    @NotNull LocalDate reviewDate,
    @NotBlank String performance,
    int reps,
    int questions,
    int accuracy,
    Integer durationSeconds   // Integer (nullable) para compatibilidade com clientes que omitem o campo
) {
    public static ReviewEventDto from(ReviewEvent e) {
        return new ReviewEventDto(
            e.getId(),
            e.getSubjectId(),
            e.getSubjectName(),
            e.getReviewDate(),
            e.getPerformance().getValue(),
            e.getReps(),
            e.getQuestions(),
            e.getAccuracy(),
            e.getDurationSeconds()
        );
    }

    public void applyTo(ReviewEvent e) {
        e.setSubjectId(this.subjectId());
        e.setSubjectName(this.subjectName());
        e.setReviewDate(this.reviewDate());
        e.setPerformance(PerformanceLevel.fromValue(this.performance()));
        e.setReps(this.reps());
        e.setQuestions(this.questions());
        e.setAccuracy(this.accuracy());
        e.setDurationSeconds(this.durationSeconds() != null ? this.durationSeconds() : 0);
    }
}
