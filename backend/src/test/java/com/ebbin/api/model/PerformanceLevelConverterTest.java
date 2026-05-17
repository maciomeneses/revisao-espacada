package com.ebbin.api.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

class PerformanceLevelConverterTest {

    private final PerformanceLevelConverter converter = new PerformanceLevelConverter();

    @Test
    @DisplayName("convertToDatabaseColumn retorna null quando atributo é null")
    void convertToDatabaseColumn_null_retornaNull() {
        assertThat(converter.convertToDatabaseColumn(null)).isNull();
    }

    @Test
    @DisplayName("convertToDatabaseColumn retorna o value de cada enum")
    void convertToDatabaseColumn_todosEnums_retornaValue() {
        assertThat(converter.convertToDatabaseColumn(PerformanceLevel.NAO_CLASSIFICADA))
                .isEqualTo("nao_classificada");
        assertThat(converter.convertToDatabaseColumn(PerformanceLevel.RUIM)).isEqualTo("ruim");
        assertThat(converter.convertToDatabaseColumn(PerformanceLevel.MEDIO)).isEqualTo("medio");
        assertThat(converter.convertToDatabaseColumn(PerformanceLevel.BOM)).isEqualTo("bom");
        assertThat(converter.convertToDatabaseColumn(PerformanceLevel.EXCELENTE))
                .isEqualTo("excelente");
    }

    @Test
    @DisplayName("convertToEntityAttribute retorna NAO_CLASSIFICADA quando dbData é null")
    void convertToEntityAttribute_null_retornaNaoClassificada() {
        assertThat(converter.convertToEntityAttribute(null))
                .isEqualTo(PerformanceLevel.NAO_CLASSIFICADA);
    }

    @Test
    @DisplayName("convertToEntityAttribute converte cada string válida no enum correspondente")
    void convertToEntityAttribute_stringsValidas_retornaEnums() {
        assertThat(converter.convertToEntityAttribute("nao_classificada"))
                .isEqualTo(PerformanceLevel.NAO_CLASSIFICADA);
        assertThat(converter.convertToEntityAttribute("ruim")).isEqualTo(PerformanceLevel.RUIM);
        assertThat(converter.convertToEntityAttribute("medio")).isEqualTo(PerformanceLevel.MEDIO);
        assertThat(converter.convertToEntityAttribute("bom")).isEqualTo(PerformanceLevel.BOM);
        assertThat(converter.convertToEntityAttribute("excelente"))
                .isEqualTo(PerformanceLevel.EXCELENTE);
    }

    @Test
    @DisplayName("convertToEntityAttribute é case-insensitive")
    void convertToEntityAttribute_caseInsensitive_retornaEnum() {
        assertThat(converter.convertToEntityAttribute("RUIM")).isEqualTo(PerformanceLevel.RUIM);
        assertThat(converter.convertToEntityAttribute("Excelente"))
                .isEqualTo(PerformanceLevel.EXCELENTE);
    }

    @Test
    @DisplayName("convertToEntityAttribute retorna NAO_CLASSIFICADA para string inválida")
    void convertToEntityAttribute_stringInvalida_retornaNaoClassificada() {
        assertThat(converter.convertToEntityAttribute("invalido"))
                .isEqualTo(PerformanceLevel.NAO_CLASSIFICADA);
        assertThat(converter.convertToEntityAttribute(""))
                .isEqualTo(PerformanceLevel.NAO_CLASSIFICADA);
    }
}
