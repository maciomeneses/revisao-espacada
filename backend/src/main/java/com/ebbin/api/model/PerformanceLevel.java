package com.ebbin.api.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Nível de desempenho de um Subject.
 * Armazenado como STRING no banco para facilitar leitura e manutenção.
 */
public enum PerformanceLevel {

    NAO_CLASSIFICADA("nao_classificada"),
    RUIM("ruim"),
    MEDIO("medio"),
    BOM("bom"),
    EXCELENTE("excelente");

    private final String value;

    PerformanceLevel(String value) {
        this.value = value;
    }

    @JsonValue
    public String getValue() {
        return value;
    }

    /**
     * Converte uma String (enviada pelo frontend) em enum.
     * Caso desconhecida, retorna NAO_CLASSIFICADA como fallback seguro.
     */
    @JsonCreator
    public static PerformanceLevel fromValue(String raw) {
        if (raw == null) return NAO_CLASSIFICADA;
        for (PerformanceLevel p : values()) {
            if (p.value.equalsIgnoreCase(raw)) return p;
        }
        return NAO_CLASSIFICADA;
    }
}
