package com.ebbin.api.dto;

import com.ebbin.api.model.ExamEntry;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record ExamEntryDto(
        Long id,
        @NotNull LocalDate examDate,
        @NotBlank String examName,
        String examType,
        @Min(0) @Max(100) int scorePercent,
        String notes,
        LocalDateTime createdAt
) {
    public static ExamEntryDto from(ExamEntry e) {
        return new ExamEntryDto(
                e.getId(),
                e.getExamDate(),
                e.getExamName(),
                e.getExamType(),
                e.getScorePercent(),
                e.getNotes(),
                e.getCreatedAt()
        );
    }

    public void applyTo(ExamEntry e) {
        e.setExamDate(this.examDate());
        e.setExamName(this.examName());
        e.setExamType(this.examType());
        e.setScorePercent(this.scorePercent());
        e.setNotes(this.notes());
    }
}
