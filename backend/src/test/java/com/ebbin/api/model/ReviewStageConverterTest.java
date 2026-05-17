package com.ebbin.api.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class ReviewStageConverterTest {

    private final ReviewStageConverter converter = new ReviewStageConverter();

    @Test
    @DisplayName("convertToDatabaseColumn retorna null quando atributo é null")
    void convertToDatabaseColumn_null_retornaNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }

    @Test
    @DisplayName("convertToDatabaseColumn retorna o value de cada enum")
    void convertToDatabaseColumn_todosEnums_retornaValue() {
        assertThat(converter.convertToDatabaseColumn(ReviewStage.AULA)).isEqualTo("aula");
        assertThat(converter.convertToDatabaseColumn(ReviewStage.LEARNING)).isEqualTo("Learning");
        assertThat(converter.convertToDatabaseColumn(ReviewStage.REVIEW)).isEqualTo("Review");
        assertThat(converter.convertToDatabaseColumn(ReviewStage.RELEARNING))
                .isEqualTo("Relearning");
        assertThat(converter.convertToDatabaseColumn(ReviewStage.NEW)).isEqualTo("New");
        assertThat(converter.convertToDatabaseColumn(ReviewStage.CONCLUIDO))
                .isEqualTo("concluido");
    }

    @Test
    @DisplayName("convertToEntityAttribute retorna AULA quando dbData é null")
    void convertToEntityAttribute_null_retornaAula() {
        assertThat(converter.convertToEntityAttribute(null)).isEqualTo(ReviewStage.AULA);
    }

    @Test
    @DisplayName("convertToEntityAttribute converte cada string válida no enum correspondente")
    void convertToEntityAttribute_stringsValidas_retornaEnums() {
        assertThat(converter.convertToEntityAttribute("aula")).isEqualTo(ReviewStage.AULA);
        assertThat(converter.convertToEntityAttribute("Learning"))
                .isEqualTo(ReviewStage.LEARNING);
        assertThat(converter.convertToEntityAttribute("Review")).isEqualTo(ReviewStage.REVIEW);
        assertThat(converter.convertToEntityAttribute("Relearning"))
                .isEqualTo(ReviewStage.RELEARNING);
        assertThat(converter.convertToEntityAttribute("New")).isEqualTo(ReviewStage.NEW);
        assertThat(converter.convertToEntityAttribute("concluido"))
                .isEqualTo(ReviewStage.CONCLUIDO);
    }

    @Test
    @DisplayName("convertToEntityAttribute é case-insensitive")
    void convertToEntityAttribute_caseInsensitive_retornaEnum() {
        assertThat(converter.convertToEntityAttribute("LEARNING"))
                .isEqualTo(ReviewStage.LEARNING);
        assertThat(converter.convertToEntityAttribute("review")).isEqualTo(ReviewStage.REVIEW);
    }

    @Test
    @DisplayName("convertToEntityAttribute retorna AULA para string inválida")
    void convertToEntityAttribute_stringInvalida_retornaAula() {
        assertThat(converter.convertToEntityAttribute("invalido")).isEqualTo(ReviewStage.AULA);
        assertThat(converter.convertToEntityAttribute("")).isEqualTo(ReviewStage.AULA);
    }
}
