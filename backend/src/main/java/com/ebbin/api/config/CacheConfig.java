package com.ebbin.api.config;

import com.github.benmanes.caffeine.cache.Caffeine;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Configuração de cache em memória usando Caffeine via Spring Cache.
 *
 * <p>O cache {@code subjects} armazena a lista de subjects por usuário para evitar
 * consultas repetidas ao banco a cada requisição de leitura. TTL de 10 minutos e
 * tamanho máximo de 1000 entradas previnem crescimento ilimitado.
 *
 * <p>Estratégia de invalidação:
 * <ul>
 *   <li>{@code getSubjects} — preenchimento (@Cacheable, chave = email do usuário)</li>
 *   <li>{@code syncSubjects}, {@code upsertSubject}, {@code deleteSubject} — eviction (@CacheEvict)</li>
 * </ul>
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /** Nome do cache de subjects por usuário. */
    public static final String SUBJECTS_CACHE = "subjects";

    @Bean
    public CacheManager cacheManager() {
        CaffeineCache subjectsCache = new CaffeineCache(
                SUBJECTS_CACHE,
                Caffeine.newBuilder()
                        .maximumSize(1_000)
                        .expireAfterWrite(10, TimeUnit.MINUTES)
                        .recordStats()
                        .build()
        );

        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(subjectsCache));
        return manager;
    }
}
