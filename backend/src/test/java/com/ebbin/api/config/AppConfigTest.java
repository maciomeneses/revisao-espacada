package com.ebbin.api.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários para {@link AppConfig}.
 */
@DisplayName("AppConfig — beans de infraestrutura geral")
class AppConfigTest {

    @Test
    @DisplayName("clock() deve retornar Clock.systemDefaultZone() para uso em produção")
    void clock_returnsSystemDefaultZoneClock() {
        AppConfig config = new AppConfig();
        Clock clock = config.clock();

        assertThat(clock).isNotNull();
        // Verifica que é um clock baseado no sistema (não fixo)
        assertThat(clock.getZone()).isEqualTo(ZoneId.systemDefault());
    }
}
