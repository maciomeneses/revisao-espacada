package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("PerformanceLevel — conversão e valores")
class PerformanceLevelTest {

    @ParameterizedTest(name = "fromValue(\"{0}\") deve retornar {1}")
    @CsvSource({
        "nao_classificada, NAO_CLASSIFICADA",
        "ruim,             RUIM",
        "medio,            MEDIO",
        "bom,              BOM",
        "excelente,        EXCELENTE"
    })
    void fromValue_knownValues_returnCorrectEnum(String raw, String expected) {
        PerformanceLevel result = PerformanceLevel.fromValue(raw);
        assertThat(result.name()).isEqualTo(expected.trim());
    }

    @Test
    @DisplayName("fromValue com valor desconhecido deve retornar NAO_CLASSIFICADA como fallback")
    void fromValue_unknown_returnsNaoClassificada() {
        assertThat(PerformanceLevel.fromValue("invalido")).isEqualTo(PerformanceLevel.NAO_CLASSIFICADA);
    }

    @Test
    @DisplayName("fromValue com null deve retornar NAO_CLASSIFICADA como fallback")
    void fromValue_null_returnsNaoClassificada() {
        assertThat(PerformanceLevel.fromValue(null)).isEqualTo(PerformanceLevel.NAO_CLASSIFICADA);
    }

    @Test
    @DisplayName("getValue deve retornar a string do frontend")
    void getValue_returnsCorrectString() {
        assertThat(PerformanceLevel.NAO_CLASSIFICADA.getValue()).isEqualTo("nao_classificada");
        assertThat(PerformanceLevel.RUIM.getValue()).isEqualTo("ruim");
        assertThat(PerformanceLevel.MEDIO.getValue()).isEqualTo("medio");
        assertThat(PerformanceLevel.BOM.getValue()).isEqualTo("bom");
        assertThat(PerformanceLevel.EXCELENTE.getValue()).isEqualTo("excelente");
    }
}
