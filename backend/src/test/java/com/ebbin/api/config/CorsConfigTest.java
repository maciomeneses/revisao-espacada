package com.ebbin.api.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.lang.reflect.Field;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários para {@link CorsConfig}.
 *
 * <p>Verifica que origens vazias resultantes de vírgulas consecutivas ou
 * espaços são filtradas antes de serem registradas no {@link CorsConfiguration},
 * cobrindo a branch {@code filter(s -> !s.isEmpty())} da lambda.</p>
 */
@DisplayName("CorsConfig — configuração de CORS")
class CorsConfigTest {

    /**
     * Instancia {@link CorsConfig} via reflexão para injetar o campo {@code allowedOriginsRaw},
     * evitando a dependência de um contexto Spring completo.
     */
    private CorsConfig buildConfig(String rawOrigins) throws Exception {
        CorsConfig config = new CorsConfig();
        Field field = CorsConfig.class.getDeclaredField("allowedOriginsRaw");
        field.setAccessible(true);
        field.set(config, rawOrigins);
        return config;
    }

    @Test
    @DisplayName("Deve registrar origens válidas e ignorar entradas vazias resultantes de vírgulas consecutivas")
    void corsConfigurationSource_shouldFilterEmptyOrigins() throws Exception {
        // "http://localhost:5173,,https://app.example.com" → split → ["http://localhost:5173", "", "https://app.example.com"]
        // O filter(s -> !s.isEmpty()) descarta a string vazia do meio
        CorsConfig config = buildConfig("http://localhost:5173,,https://app.example.com");

        CorsConfigurationSource source = config.corsConfigurationSource();
        assertThat(source).isNotNull();

        // Extrai o CorsConfiguration para validar as origens registradas
        UrlBasedCorsConfigurationSource urlSource = (UrlBasedCorsConfigurationSource) source;
        CorsConfiguration corsConfig = urlSource.getCorsConfigurations().get("/**");
        assertThat(corsConfig).isNotNull();
        assertThat(corsConfig.getAllowedOrigins())
                .containsExactlyInAnyOrder("http://localhost:5173", "https://app.example.com")
                .doesNotContain("");
    }

    @Test
    @DisplayName("Deve registrar uma única origem válida sem filtrar nada")
    void corsConfigurationSource_singleOrigin_registersCorrectly() throws Exception {
        CorsConfig config = buildConfig("http://localhost:5173");

        CorsConfigurationSource source = config.corsConfigurationSource();
        UrlBasedCorsConfigurationSource urlSource = (UrlBasedCorsConfigurationSource) source;
        CorsConfiguration corsConfig = urlSource.getCorsConfigurations().get("/**");

        assertThat(corsConfig.getAllowedOrigins()).containsExactly("http://localhost:5173");
        assertThat(corsConfig.getAllowCredentials()).isTrue();
        assertThat(corsConfig.getMaxAge()).isEqualTo(3600L);
    }
}
