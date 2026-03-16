package com.ebbin.api.service;

import com.ebbin.api.repository.PasswordResetTokenRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários para {@link TokenCleanupService}.
 *
 * <p>Verifica que a task de limpeza delega corretamente ao repositório com o
 * instante atual e processa o resultado (sem lançar exceções em cenários normais).</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TokenCleanupService — limpeza periódica de tokens expirados/utilizados")
class TokenCleanupServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-01-01T10:00:00Z");
    private final Clock fixedClock = Clock.fixed(FIXED_INSTANT, ZoneId.of("UTC"));

    @Mock
    PasswordResetTokenRepository resetTokenRepository;

    TokenCleanupService tokenCleanupService;

    @org.junit.jupiter.api.BeforeEach
    void setUp() {
        tokenCleanupService = new TokenCleanupService(resetTokenRepository, fixedClock);
    }

    @Test
    @DisplayName("purgeExpiredAndUsedTokens deve chamar deleteExpiredOrUsed com LocalDateTime.now(clock)")
    void purge_callsRepositoryWithCurrentTime() {
        when(resetTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class))).thenReturn(0);

        tokenCleanupService.purgeExpiredAndUsedTokens();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(resetTokenRepository).deleteExpiredOrUsed(captor.capture());

        LocalDateTime expected = LocalDateTime.now(fixedClock);
        assertThat(captor.getValue()).isEqualTo(expected);
    }

    @Test
    @DisplayName("purgeExpiredAndUsedTokens deve completar sem exceção quando nenhum token é removido")
    void purge_noTokensDeleted_completesWithoutException() {
        when(resetTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class))).thenReturn(0);

        // Não deve lançar exceção
        tokenCleanupService.purgeExpiredAndUsedTokens();

        verify(resetTokenRepository).deleteExpiredOrUsed(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("purgeExpiredAndUsedTokens deve completar sem exceção quando tokens são removidos")
    void purge_tokensDeleted_completesWithoutException() {
        when(resetTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class))).thenReturn(5);

        // Não deve lançar exceção mesmo com tokens removidos
        tokenCleanupService.purgeExpiredAndUsedTokens();

        verify(resetTokenRepository).deleteExpiredOrUsed(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("purgeExpiredAndUsedTokens deve propagar exceção do repositório")
    void purge_repositoryThrows_propagatesException() {
        when(resetTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("DB error"));

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> tokenCleanupService.purgeExpiredAndUsedTokens())
                .isInstanceOf(RuntimeException.class)
                .hasMessage("DB error");
    }
}
