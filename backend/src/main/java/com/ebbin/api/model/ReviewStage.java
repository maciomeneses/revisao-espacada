package com.ebbin.api.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Estágios de revisão de um Subject, compatível com os valores FSRS e legado.
 * Armazenado como STRING no banco para facilitar leitura e manutenção.
 */
public enum ReviewStage {

    AULA("aula"),
    LEARNING("Learning"),
    REVIEW("Review"),
    RELEARNING("Relearning"),
    NEW("New"),
    CONCLUIDO("concluido");

    private final String value;

    ReviewStage(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    /**
     * Converte uma String (enviada pelo frontend) em enum.
     * Caso desconhecida, retorna AULA como fallback seguro.
     */
    @JsonCreator
    public static ReviewStage fromValue(String raw) {
        if (raw == null) return AULA;
        for (ReviewStage s : values()) {
            if (s.value.equalsIgnoreCase(raw)) return s;
        }
        return AULA;
    }
}
