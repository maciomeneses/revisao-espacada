package com.ebbin.api.dto;

import com.ebbin.api.model.Area;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO de {@link Area}. Usa {@code Long} para o {@code id} (PK do banco, exposto
 * no catálogo, diferente de Subject que usa clientId).
 */
public record AreaDto(
    Long id,
    @NotBlank @Size(max = 120) String name
) {
    public static AreaDto from(Area a) {
        return new AreaDto(a.getId(), a.getName());
    }
}
