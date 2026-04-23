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
 * <p>Cada cache é particionado por e-mail do usuário; TTL de 10 minutos e tamanho máximo
 * de 1000 entradas previnem crescimento ilimitado.
 *
 * <p>Estratégia de invalidação:
 * <ul>
 *   <li>{@code subjects} — {@code getSubjects} preenche (@Cacheable); sync/upsert/delete evict</li>
 *   <li>{@code areas} — {@code getAreas} preenche; create/rename/delete evict</li>
 *   <li>{@code disciplines} — {@code getDisciplines} preenche; create/rename/delete evict</li>
 * </ul>
 * Como o rename de uma área atualiza disciplines/subjects associados, o service faz
 * eviction dos três caches em operações de rename/delete de área.
 */
@Configuration
@EnableCaching
public class CacheConfig {

    /** Nome do cache de subjects por usuário. */
    public static final String SUBJECTS_CACHE = "subjects";

    /** Nome do cache de areas por usuário. */
    public static final String AREAS_CACHE = "areas";

    /** Nome do cache de disciplines por usuário. */
    public static final String DISCIPLINES_CACHE = "disciplines";

    @Bean
    public CacheManager cacheManager() {
        SimpleCacheManager manager = new SimpleCacheManager();
        manager.setCaches(List.of(
                buildCache(SUBJECTS_CACHE),
                buildCache(AREAS_CACHE),
                buildCache(DISCIPLINES_CACHE)
        ));
        return manager;
    }

    private static CaffeineCache buildCache(String name) {
        return new CaffeineCache(
                name,
                Caffeine.newBuilder()
                        .maximumSize(1_000)
                        .expireAfterWrite(10, TimeUnit.MINUTES)
                        .recordStats()
                        .build()
        );
    }
}
