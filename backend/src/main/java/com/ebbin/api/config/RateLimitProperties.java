package com.ebbin.api.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Propriedades de rate limiting configuráveis via application.yml.
 * Prefixo: app.rate-limit.login
 */
@Component
@ConfigurationProperties(prefix = "app.rate-limit.login")
public class RateLimitProperties {

    /** Capacidade máxima do bucket (tokens iniciais e máximos). Padrão: 5 */
    private int capacity = 5;

    /** Quantidade de tokens adicionados a cada recarga. Padrão: 5 */
    private int refillTokens = 5;

    /** Intervalo de recarga em minutos. Padrão: 1 */
    private int refillMinutes = 1;

    public int getCapacity() { return capacity; }
    public void setCapacity(int capacity) { this.capacity = capacity; }

    public int getRefillTokens() { return refillTokens; }
    public void setRefillTokens(int refillTokens) { this.refillTokens = refillTokens; }

    public int getRefillMinutes() { return refillMinutes; }
    public void setRefillMinutes(int refillMinutes) { this.refillMinutes = refillMinutes; }
}
