package com.ebbin.api.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.cache.CacheManager;
import org.springframework.cache.caffeine.CaffeineCache;
import org.springframework.cache.support.SimpleCacheManager;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testa a configuração do CacheManager para garantir que o cache "subjects"
 * está devidamente registrado e usa Caffeine como implementação.
 */
@DisplayName("CacheConfig — configuração de cache Caffeine")
class CacheConfigTest {

    private final CacheConfig cacheConfig = new CacheConfig();

    /** Cria o CacheManager e invoca afterPropertiesSet() para inicializá-lo. */
    private CacheManager buildManager() throws Exception {
        SimpleCacheManager manager = (SimpleCacheManager) cacheConfig.cacheManager();
        manager.afterPropertiesSet();
        return manager;
    }

    @Test
    @DisplayName("cacheManager deve conter o cache 'subjects'")
    void cacheManager_containsSubjectsCache() throws Exception {
        CacheManager manager = buildManager();

        assertThat(manager.getCacheNames()).contains(CacheConfig.SUBJECTS_CACHE);
    }

    @Test
    @DisplayName("cache 'subjects' deve ser instância de CaffeineCache")
    void subjectsCache_isCaffeineCache() throws Exception {
        CacheManager manager = buildManager();

        assertThat(manager.getCache(CacheConfig.SUBJECTS_CACHE))
                .isInstanceOf(CaffeineCache.class);
    }

    @Test
    @DisplayName("SUBJECTS_CACHE deve ter o valor esperado 'subjects'")
    void subjectsCacheName_isCorrect() {
        assertThat(CacheConfig.SUBJECTS_CACHE).isEqualTo("subjects");
    }
}
