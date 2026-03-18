package com.ebbin.api.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converte {@link PerformanceLevel} para/de String no banco usando o {@code value}
 * do enum (ex: "nao_classificada", "ruim"), em vez do {@code name()} do enum.
 *
 * <p>Aplica-se automaticamente a todos os campos do tipo {@link PerformanceLevel}.</p>
 */
@Converter(autoApply = true)
public class PerformanceLevelConverter implements AttributeConverter<PerformanceLevel, String> {

    @Override
    public String convertToDatabaseColumn(PerformanceLevel attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public PerformanceLevel convertToEntityAttribute(String dbData) {
        return PerformanceLevel.fromValue(dbData);
    }
}
