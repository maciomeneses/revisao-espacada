package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("ReviewStage — conversão e valores")
class ReviewStageTest {

    @ParameterizedTest(name = "fromValue(\"{0}\") deve retornar {1}")
    @CsvSource({
        "aula,       AULA",
        "Learning,   LEARNING",
        "Review,     REVIEW",
        "Relearning, RELEARNING",
        "New,        NEW",
        "concluido,  CONCLUIDO"
    })
    void fromValue_knownValues_returnCorrectEnum(String raw, String expected) {
        ReviewStage result = ReviewStage.fromValue(raw);
        assertThat(result.name()).isEqualTo(expected.trim());
    }

    @Test
    @DisplayName("fromValue com valor desconhecido deve retornar AULA como fallback")
    void fromValue_unknown_returnsAula() {
        assertThat(ReviewStage.fromValue("invalido")).isEqualTo(ReviewStage.AULA);
    }

    @Test
    @DisplayName("fromValue com null deve retornar AULA como fallback")
    void fromValue_null_returnsAula() {
        assertThat(ReviewStage.fromValue(null)).isEqualTo(ReviewStage.AULA);
    }

    @Test
    @DisplayName("getValue deve retornar a string do frontend")
    void getValue_returnsCorrectString() {
        assertThat(ReviewStage.AULA.getValue()).isEqualTo("aula");
        assertThat(ReviewStage.LEARNING.getValue()).isEqualTo("Learning");
        assertThat(ReviewStage.REVIEW.getValue()).isEqualTo("Review");
        assertThat(ReviewStage.RELEARNING.getValue()).isEqualTo("Relearning");
        assertThat(ReviewStage.NEW.getValue()).isEqualTo("New");
        assertThat(ReviewStage.CONCLUIDO.getValue()).isEqualTo("concluido");
    }
}
