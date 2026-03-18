package com.ebbin.api.model;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * Converte {@link ReviewStage} para/de String no banco usando o {@code value}
 * do enum (ex: "Learning", "aula"), em vez do {@code name()} do enum (ex: "LEARNING").
 *
 * <p>Necessário porque {@code @Enumerated(EnumType.STRING)} usa {@code Enum.name()},
 * enquanto os dados gravados anteriormente usavam o valor JSON ({@code @JsonValue}).
 * Com {@code autoApply = true}, aplica-se automaticamente a todos os campos do tipo
 * {@link ReviewStage} sem necessidade de {@code @Convert} explícito.</p>
 */
@Converter(autoApply = true)
public class ReviewStageConverter implements AttributeConverter<ReviewStage, String> {

    @Override
    public String convertToDatabaseColumn(ReviewStage attribute) {
        return attribute == null ? null : attribute.getValue();
    }

    @Override
    public ReviewStage convertToEntityAttribute(String dbData) {
        return ReviewStage.fromValue(dbData);
    }
}
