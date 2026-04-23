package com.ebbin.api.dto;

import com.ebbin.api.model.Discipline;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO de {@link Discipline}. Inclui {@code areaName} para facilitar o consumo
 * do frontend (evita join adicional no cliente).
 */
public record DisciplineDto(
    Long id,
    @NotNull Long areaId,
    String areaName,
    @NotBlank @Size(max = 120) String name
) {
    public static DisciplineDto from(Discipline d) {
        return new DisciplineDto(
            d.getId(),
            d.getArea().getId(),
            d.getArea().getName(),
            d.getName()
        );
    }
}
