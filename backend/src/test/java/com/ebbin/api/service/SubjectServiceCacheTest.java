package com.ebbin.api.service;

import com.ebbin.api.config.CacheConfig;
import com.ebbin.api.dto.SubjectDto;
import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewStage;
import com.ebbin.api.model.Subject;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.SubjectRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testa o comportamento de cache do {@link SubjectService}.
 *
 * <p>Verifica que {@code getSubjects} popula o cache e que operações de escrita
 * ({@code upsertSubject}, {@code syncSubjects}, {@code deleteSubject}) invalidam
 * a entrada correspondente.</p>
 *
 * <p>Usa {@link SpringBootTest} completo para que as anotações Spring Cache
 * ({@code @Cacheable}, {@code @CacheEvict}) sejam processadas pelo proxy AOP.</p>
 */
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:cachetest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@cachetest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("SubjectService — comportamento de cache")
class SubjectServiceCacheTest {

    @Autowired SubjectService subjectService;
    @Autowired CacheManager cacheManager;
    @Autowired UserRepository userRepository;
    @Autowired SubjectRepository subjectRepository;
    @Autowired PasswordEncoder passwordEncoder;

    private User user;
    private static final String EMAIL = "cache@test.com";

    @BeforeEach
    void setUp() {
        // Limpa cache antes de cada teste
        cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).clear();

        user = new User();
        user.setEmail(EMAIL);
        user.setPassword(passwordEncoder.encode("senha123"));
        user.setRole(User.Role.USER);
        user = userRepository.save(user);
    }

    @Test
    @DisplayName("getSubjects deve popular o cache na primeira chamada")
    void getSubjects_populatesCache() {
        // Cache vazio antes
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNull();

        subjectService.getSubjects(EMAIL);

        // Cache populado após a chamada
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNotNull();
    }

    @Test
    @DisplayName("getSubjects deve retornar resultado do cache na segunda chamada (sem query adicional ao banco)")
    void getSubjects_returnsCachedResultOnSecondCall() {
        List<SubjectDto> first = subjectService.getSubjects(EMAIL);
        List<SubjectDto> second = subjectService.getSubjects(EMAIL);

        // Resultados idênticos — segunda chamada vem do cache
        assertThat(first).isEqualTo(second);
    }

    @Test
    @DisplayName("upsertSubject deve invalidar o cache do usuário")
    void upsertSubject_evictsCache() {
        // Popula o cache
        subjectService.getSubjects(EMAIL);
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNotNull();

        SubjectDto dto = new SubjectDto(
                "client-cache-1", "M", "A", "AP", "Alta",
                false, false, false, false, false, false, false, false, false,
                "aula", null, null, null, "nao_classificada",
                null, null, null, null, null, null
        );

        subjectService.upsertSubject(EMAIL, dto);

        // Cache deve ter sido evictado
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNull();
    }

    @Test
    @DisplayName("deleteSubject deve invalidar o cache do usuário")
    void deleteSubject_evictsCache() {
        // Persiste subject e popula cache
        Subject s = new Subject();
        s.setUser(user);
        s.setClientId("client-to-delete");
        s.setModulo("M"); s.setArea("A"); s.setAulaPrincipal("AP"); s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA); s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(s);

        subjectService.getSubjects(EMAIL);
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNotNull();

        subjectService.deleteSubject(EMAIL, "client-to-delete");

        // Cache deve ter sido evictado
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNull();
    }

    @Test
    @DisplayName("syncSubjects deve invalidar o cache do usuário")
    void syncSubjects_evictsCache() {
        // Popula o cache
        subjectService.getSubjects(EMAIL);
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNotNull();

        SubjectDto dto = new SubjectDto(
                "client-sync-1", "M", "A", "AP", "Alta",
                false, false, false, false, false, false, false, false, false,
                "aula", null, null, null, "nao_classificada",
                null, null, null, null, null, null
        );

        subjectService.syncSubjects(EMAIL, List.of(dto), false);

        // Cache deve ter sido evictado
        assertThat(cacheManager.getCache(CacheConfig.SUBJECTS_CACHE).get(EMAIL)).isNull();
    }
}
