package com.ebbin.api.config;

import com.ebbin.api.config.RateLimitProperties.EndpointConfig;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários para {@link RateLimitProperties}.
 *
 * <p>Cobre os três branches de {@link RateLimitProperties#getEndpointConfig(String)}:
 * <ol>
 *   <li>Endpoint configurado explicitamente no mapa ({@code endpoints.containsKey})</li>
 *   <li>Fallback para propriedades legadas quando a chave é {@code "login"}</li>
 *   <li>Defaults genéricos para qualquer outro endpoint não configurado</li>
 * </ol>
 * E os getters legados ({@link RateLimitProperties#getCapacity()},
 * {@link RateLimitProperties#getRefillTokens()}, {@link RateLimitProperties#getRefillMinutes()})
 * mantidos por retrocompatibilidade via {@code @ConfigurationProperties}.
 * </p>
 */
@DisplayName("RateLimitProperties — cobertura de branches e getters legados")
class RateLimitPropertiesTest {

    private RateLimitProperties props;

    @BeforeEach
    void setUp() {
        props = new RateLimitProperties();
    }

    // ---- getEndpointConfig: branch 1 — endpoint no mapa ----

    @Test
    @DisplayName("getEndpointConfig deve retornar config explícita quando endpoint está no mapa")
    void getEndpointConfig_explicitlyConfigured_returnsMapEntry() {
        EndpointConfig loginConfig = new EndpointConfig(10, 10, 2, 30);
        props.setEndpoints(Map.of("login", loginConfig));

        EndpointConfig result = props.getEndpointConfig("login");

        assertThat(result).isSameAs(loginConfig);
        assertThat(result.getCapacity()).isEqualTo(10);
        assertThat(result.getRefillTokens()).isEqualTo(10);
        assertThat(result.getRefillMinutes()).isEqualTo(2);
        assertThat(result.getTtlMinutes()).isEqualTo(30);
    }

    @Test
    @DisplayName("getEndpointConfig deve retornar config explícita para forgot-password quando configurado")
    void getEndpointConfig_forgotPasswordConfigured_returnsMapEntry() {
        EndpointConfig forgotConfig = new EndpointConfig(3, 3, 10, 120);
        props.setEndpoints(Map.of("forgot-password", forgotConfig));

        EndpointConfig result = props.getEndpointConfig("forgot-password");

        assertThat(result).isSameAs(forgotConfig);
        assertThat(result.getCapacity()).isEqualTo(3);
        assertThat(result.getTtlMinutes()).isEqualTo(120);
    }

    // ---- getEndpointConfig: branch 2 — fallback login legado ----

    @Test
    @DisplayName("getEndpointConfig deve usar valores legados como fallback para 'login' quando ausente do mapa")
    void getEndpointConfig_loginFallback_usesLegacyValues() {
        // Mapa vazio — fallback para os campos legados
        props.setEndpoints(Map.of());
        props.setCapacity(7);
        props.setRefillTokens(7);
        props.setRefillMinutes(2);

        EndpointConfig result = props.getEndpointConfig("login");

        assertThat(result.getCapacity()).isEqualTo(7);
        assertThat(result.getRefillTokens()).isEqualTo(7);
        assertThat(result.getRefillMinutes()).isEqualTo(2);
        assertThat(result.getTtlMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("getEndpointConfig fallback login deve usar defaults quando valores legados não configurados")
    void getEndpointConfig_loginFallback_usesDefaults() {
        props.setEndpoints(Map.of()); // mapa vazio, valores legados com defaults (5, 5, 1)

        EndpointConfig result = props.getEndpointConfig("login");

        assertThat(result.getCapacity()).isEqualTo(5);
        assertThat(result.getRefillTokens()).isEqualTo(5);
        assertThat(result.getRefillMinutes()).isEqualTo(1);
    }

    // ---- getEndpointConfig: branch 3 — defaults genéricos ----

    @Test
    @DisplayName("getEndpointConfig deve retornar defaults genéricos para endpoint desconhecido")
    void getEndpointConfig_unknownEndpoint_returnsGenericDefaults() {
        props.setEndpoints(Map.of()); // mapa vazio, chave não é "login"

        EndpointConfig result = props.getEndpointConfig("forgot-password");

        assertThat(result.getCapacity()).isEqualTo(5);
        assertThat(result.getRefillTokens()).isEqualTo(5);
        assertThat(result.getRefillMinutes()).isEqualTo(1);
        assertThat(result.getTtlMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("getEndpointConfig deve retornar defaults para qualquer endpoint não mapeado")
    void getEndpointConfig_arbitraryUnknownKey_returnsDefaults() {
        props.setEndpoints(Map.of());

        EndpointConfig result = props.getEndpointConfig("register");

        assertThat(result.getCapacity()).isEqualTo(5);
        assertThat(result.getRefillMinutes()).isEqualTo(1);
        assertThat(result.getTtlMinutes()).isEqualTo(60);
    }

    // ---- Getters/setters legados ----

    @Test
    @DisplayName("Getters e setters legados devem ler e escrever corretamente")
    void legacyGettersSetters_roundTrip() {
        props.setCapacity(8);
        props.setRefillTokens(4);
        props.setRefillMinutes(3);

        assertThat(props.getCapacity()).isEqualTo(8);
        assertThat(props.getRefillTokens()).isEqualTo(4);
        assertThat(props.getRefillMinutes()).isEqualTo(3);
    }

    // ---- EndpointConfig: construtor e setters ----

    @Test
    @DisplayName("EndpointConfig construtor padrão deve ter valores default")
    void endpointConfig_defaultConstructor_hasDefaults() {
        EndpointConfig config = new EndpointConfig();

        assertThat(config.getCapacity()).isEqualTo(5);
        assertThat(config.getRefillTokens()).isEqualTo(5);
        assertThat(config.getRefillMinutes()).isEqualTo(1);
        assertThat(config.getTtlMinutes()).isEqualTo(60);
    }

    @Test
    @DisplayName("EndpointConfig setters devem atualizar valores corretamente")
    void endpointConfig_setters_updateValues() {
        EndpointConfig config = new EndpointConfig();
        config.setCapacity(20);
        config.setRefillTokens(15);
        config.setRefillMinutes(5);
        config.setTtlMinutes(90);

        assertThat(config.getCapacity()).isEqualTo(20);
        assertThat(config.getRefillTokens()).isEqualTo(15);
        assertThat(config.getRefillMinutes()).isEqualTo(5);
        assertThat(config.getTtlMinutes()).isEqualTo(90);
    }

    // ---- trustedProxies getter/setter ----

    @Test
    @DisplayName("getTrustedProxies deve retornar lista vazia por padrão (postura segura)")
    void getTrustedProxies_default_isEmpty() {
        assertThat(props.getTrustedProxies()).isEmpty();
    }

    @Test
    @DisplayName("setTrustedProxies deve armazenar e retornar a lista configurada")
    void setTrustedProxies_storesAndReturnsConfiguredList() {
        List<String> proxies = List.of("10.0.0.1", "172.16.0.1");
        props.setTrustedProxies(proxies);

        assertThat(props.getTrustedProxies()).containsExactlyInAnyOrder("10.0.0.1", "172.16.0.1");
    }
}
