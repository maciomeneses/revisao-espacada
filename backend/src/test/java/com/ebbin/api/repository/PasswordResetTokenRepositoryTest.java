package com.ebbin.api.repository;

import com.ebbin.api.model.PasswordResetToken;
import com.ebbin.api.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes de integração para o método {@code deleteExpiredOrUsed} do
 * {@link PasswordResetTokenRepository}.
 *
 * <p>Valida a query JPQL {@code @Modifying} que remove tokens expirados ou utilizados,
 * garantindo que a purga periódica do {@link com.ebbin.api.service.TokenCleanupService}
 * funciona corretamente.</p>
 */
@SpringBootTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:tokencleanuptest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@cleanuptest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("PasswordResetTokenRepository — deleteExpiredOrUsed query")
class PasswordResetTokenRepositoryTest {

    @Autowired
    PasswordResetTokenRepository tokenRepository;

    @Autowired
    UserRepository userRepository;

    private User testUser;

    @BeforeEach
    void setUp() {
        // Usa o admin criado pelo AdminInitializer
        testUser = userRepository.findByEmail("admin@cleanuptest.com").orElseThrow();
    }

    @Test
    @DisplayName("deleteExpiredOrUsed deve remover tokens expirados")
    void deleteExpiredOrUsed_removesExpiredTokens() {
        // Cria token expirado (expiresAt no passado)
        String expiredToken = "expired-token-uuid-1234567890-abcd";
        PasswordResetToken expired = new PasswordResetToken(
                testUser, expiredToken, LocalDateTime.now().minusMinutes(1));
        tokenRepository.save(expired);
        tokenRepository.flush();

        // Cria token válido (expiresAt no futuro, não usado)
        String validToken = "valid-token-uuid-1234567890-abcdef";
        PasswordResetToken valid = new PasswordResetToken(
                testUser, validToken, LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(valid);
        tokenRepository.flush();

        int deleted = tokenRepository.deleteExpiredOrUsed(LocalDateTime.now());

        assertThat(deleted).isGreaterThanOrEqualTo(1);
        assertThat(tokenRepository.findByToken(expiredToken)).isEmpty();
        assertThat(tokenRepository.findByToken(validToken)).isPresent();
    }

    @Test
    @DisplayName("deleteExpiredOrUsed deve remover tokens já utilizados")
    void deleteExpiredOrUsed_removesUsedTokens() {
        // Cria token usado (ainda não expirado, mas used=true)
        String usedToken = "used-token-uuid-1234567890-abcdefg";
        PasswordResetToken used = new PasswordResetToken(
                testUser, usedToken, LocalDateTime.now().plusMinutes(15));
        used.setUsed(true);
        tokenRepository.save(used);
        tokenRepository.flush();

        int deleted = tokenRepository.deleteExpiredOrUsed(LocalDateTime.now());

        assertThat(deleted).isGreaterThanOrEqualTo(1);
        assertThat(tokenRepository.findByToken(usedToken)).isEmpty();
    }

    @Test
    @DisplayName("deleteExpiredOrUsed não deve remover tokens válidos e não utilizados")
    void deleteExpiredOrUsed_preservesValidTokens() {
        // Cria token válido
        String validToken = "still-valid-token-uuid-1234567890ab";
        PasswordResetToken valid = new PasswordResetToken(
                testUser, validToken, LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(valid);
        tokenRepository.flush();

        // Purga somente expirados/usados — o válido deve permanecer
        tokenRepository.deleteExpiredOrUsed(LocalDateTime.now());

        assertThat(tokenRepository.findByToken(validToken)).isPresent();
    }

    @Test
    @DisplayName("deleteExpiredOrUsed deve retornar 0 quando não há tokens obsoletos")
    void deleteExpiredOrUsed_returnsZeroWhenNothingToDelete() {
        // Cria apenas token válido
        String validToken = "only-valid-token-uuid-1234567890abc";
        PasswordResetToken valid = new PasswordResetToken(
                testUser, validToken, LocalDateTime.now().plusMinutes(15));
        tokenRepository.save(valid);
        tokenRepository.flush();

        // Limpa apenas o que expirou antes de agora — o token acima não deve ser removido
        // (Atenção: o admin criado pelo AdminInitializer pode não ter tokens no teardown)
        int deleted = tokenRepository.deleteExpiredOrUsed(LocalDateTime.now().minusHours(1));

        // Não deve ter tokens expirados antes de uma hora atrás
        assertThat(deleted).isEqualTo(0);
    }
}
