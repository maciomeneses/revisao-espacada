package com.ebbin.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Propriedades de rate limiting configuráveis via application.yml.
 *
 * <p>Suporta configuração por endpoint via mapa {@code endpoints}, onde a chave é o
 * sufixo do path (e.g., {@code login}, {@code forgot-password}).
 * As configurações legadas do prefixo {@code app.rate-limit.login.*} são mantidas para
 * retrocompatibilidade — seus valores são copiados para {@code endpoints["login"]} se o
 * mapa não definir explicitamente aquela entrada.</p>
 *
 * <p>Propriedades TTL (ttlMinutes) controlam o tempo de vida dos buckets inativos no
 * Caffeine cache, resolvendo o crescimento ilimitado do ConcurrentHashMap anterior.</p>
 *
 * <p>A lista {@code trustedProxies} controla quais endereços IP de proxy reverso são
 * confiáveis para leitura do header {@code X-Forwarded-For}. Quando a requisição chega
 * de um IP que <em>não</em> está nessa lista, o header {@code X-Forwarded-For} é
 * ignorado e o IP real da conexão TCP ({@code remoteAddr}) é usado — prevenindo forjamento
 * de IP por clientes que se conectam diretamente ao servidor.</p>
 *
 * <p>Prefixo: {@code app.rate-limit}</p>
 */
@Component
@ConfigurationProperties(prefix = "app.rate-limit")
public class RateLimitProperties {

    /**
     * Mapa de configuração por endpoint.
     * Chave: identificador do endpoint (e.g., {@code login}, {@code forgot-password}).
     * Valor: {@link EndpointConfig} com parâmetros do bucket.
     */
    private Map<String, EndpointConfig> endpoints = new HashMap<>();

    /**
     * Lista de IPs ou CIDRs de proxies reversos confiáveis cujos headers
     * {@code X-Forwarded-For} serão respeitados.
     *
     * <p>Exemplo no application.yml:
     * <pre>
     * app:
     *   rate-limit:
     *     trusted-proxies:
     *       - "10.0.0.1"
     *       - "172.16.0.0/12"
     * </pre>
     * </p>
     *
     * <p>Se a lista estiver vazia (padrão), o header {@code X-Forwarded-For} é sempre
     * ignorado e o {@code remoteAddr} é utilizado como identificador do cliente — postura
     * segura por padrão para ambientes sem proxy configurado.</p>
     */
    private List<String> trustedProxies = new ArrayList<>();

    // --- Propriedades legadas (prefixo app.rate-limit.login.*) ---
    // Mantidas para não quebrar configurações existentes via variáveis de ambiente.

    /** @deprecated Use {@code app.rate-limit.endpoints.login.capacity} */
    @Deprecated
    private int loginCapacity = 5;

    /** @deprecated Use {@code app.rate-limit.endpoints.login.refill-tokens} */
    @Deprecated
    private int loginRefillTokens = 5;

    /** @deprecated Use {@code app.rate-limit.endpoints.login.refill-minutes} */
    @Deprecated
    private int loginRefillMinutes = 1;

    // Getter/setters legados para binding via @ConfigurationProperties (login.*)
    public int getCapacity()               { return loginCapacity; }
    public void setCapacity(int v)         { this.loginCapacity = v; }
    public int getRefillTokens()           { return loginRefillTokens; }
    public void setRefillTokens(int v)     { this.loginRefillTokens = v; }
    public int getRefillMinutes()          { return loginRefillMinutes; }
    public void setRefillMinutes(int v)    { this.loginRefillMinutes = v; }

    public Map<String, EndpointConfig> getEndpoints() { return endpoints; }
    public void setEndpoints(Map<String, EndpointConfig> endpoints) { this.endpoints = endpoints; }

    public List<String> getTrustedProxies() { return trustedProxies; }
    public void setTrustedProxies(List<String> trustedProxies) { this.trustedProxies = trustedProxies; }

    /**
     * Retorna a configuração do endpoint pelo identificador, usando os valores legados do
     * endpoint {@code login} como fallback quando nenhuma entrada explícita existe.
     *
     * @param endpointKey identificador do endpoint (e.g., {@code login}, {@code forgot-password})
     * @return configuração efectiva para o endpoint
     */
    public EndpointConfig getEndpointConfig(String endpointKey) {
        if (endpoints.containsKey(endpointKey)) {
            return endpoints.get(endpointKey);
        }
        // Fallback: usa valores legados para "login", defaults para o restante
        if ("login".equals(endpointKey)) {
            return new EndpointConfig(loginCapacity, loginRefillTokens, loginRefillMinutes, 60);
        }
        return new EndpointConfig(5, 5, 1, 60);
    }

    /**
     * Configuração de rate limit para um único endpoint.
     */
    public static class EndpointConfig {

        /** Capacidade máxima do bucket. Padrão: 5 */
        private int capacity = 5;

        /** Tokens recarregados a cada intervalo. Padrão: 5 */
        private int refillTokens = 5;

        /** Intervalo de recarga em minutos. Padrão: 1 */
        private int refillMinutes = 1;

        /**
         * Tempo de vida (TTL) em minutos para buckets inativos no Caffeine cache.
         * Controla a eviction automática, prevenindo crescimento ilimitado de memória.
         * Padrão: 60 minutos.
         */
        private int ttlMinutes = 60;

        public EndpointConfig() {}

        public EndpointConfig(int capacity, int refillTokens, int refillMinutes, int ttlMinutes) {
            this.capacity = capacity;
            this.refillTokens = refillTokens;
            this.refillMinutes = refillMinutes;
            this.ttlMinutes = ttlMinutes;
        }

        public int getCapacity()               { return capacity; }
        public void setCapacity(int v)         { this.capacity = v; }
        public int getRefillTokens()           { return refillTokens; }
        public void setRefillTokens(int v)     { this.refillTokens = v; }
        public int getRefillMinutes()          { return refillMinutes; }
        public void setRefillMinutes(int v)    { this.refillMinutes = v; }
        public int getTtlMinutes()             { return ttlMinutes; }
        public void setTtlMinutes(int v)       { this.ttlMinutes = v; }
    }
}
