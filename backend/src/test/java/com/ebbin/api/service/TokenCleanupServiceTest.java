package com.ebbin.api.service;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.EmailVerificationTokenRepository;
import com.ebbin.api.repository.PasswordResetTokenRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Testes unitários para {@link TokenCleanupService}.
 *
 * <p>Verifica que a task de limpeza delega corretamente aos repositórios com o
 * instante atual, purga contas não verificadas além do TTL e processa o
 * resultado (sem lançar exceções em cenários normais).</p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("TokenCleanupService — limpeza periódica de tokens e contas não verificadas")
class TokenCleanupServiceTest {

    private static final Instant FIXED_INSTANT = Instant.parse("2026-01-01T10:00:00Z");
    private static final int UNVERIFIED_TTL_HOURS = 48;

    private final Clock fixedClock = Clock.fixed(FIXED_INSTANT, ZoneId.of("UTC"));

    @Mock PasswordResetTokenRepository resetTokenRepository;
    @Mock EmailVerificationTokenRepository verificationTokenRepository;
    @Mock UserRepository userRepository;

    TokenCleanupService tokenCleanupService;

    @BeforeEach
    void setUp() {
        tokenCleanupService = new TokenCleanupService(
                resetTokenRepository, verificationTokenRepository, userRepository,
                UNVERIFIED_TTL_HOURS, fixedClock);
        // lenient: nem todo teste exercita os três repositórios (ex.: exceção no primeiro)
        lenient().when(resetTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class))).thenReturn(0);
        lenient().when(verificationTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class))).thenReturn(0);
        lenient().when(userRepository.findUnverifiedCreatedBefore(any(LocalDateTime.class))).thenReturn(List.of());
    }

    @Test
    @DisplayName("purga chama deleteExpiredOrUsed dos dois repositórios com LocalDateTime.now(clock)")
    void purge_callsRepositoriesWithCurrentTime() {
        tokenCleanupService.purgeExpiredAndUsedTokens();

        LocalDateTime expected = LocalDateTime.now(fixedClock);

        ArgumentCaptor<LocalDateTime> resetCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(resetTokenRepository).deleteExpiredOrUsed(resetCaptor.capture());
        assertThat(resetCaptor.getValue()).isEqualTo(expected);

        ArgumentCaptor<LocalDateTime> verifyCaptor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(verificationTokenRepository).deleteExpiredOrUsed(verifyCaptor.capture());
        assertThat(verifyCaptor.getValue()).isEqualTo(expected);
    }

    @Test
    @DisplayName("purga busca contas não verificadas com cutoff = now - TTL")
    void purge_usesUnverifiedCutoffWithTtl() {
        tokenCleanupService.purgeExpiredAndUsedTokens();

        ArgumentCaptor<LocalDateTime> captor = ArgumentCaptor.forClass(LocalDateTime.class);
        verify(userRepository).findUnverifiedCreatedBefore(captor.capture());

        LocalDateTime expected = LocalDateTime.now(fixedClock).minusHours(UNVERIFIED_TTL_HOURS);
        assertThat(captor.getValue()).isEqualTo(expected);
        verify(userRepository, never()).deleteAll(any());
    }

    @Test
    @DisplayName("purga remove contas não verificadas além do TTL via deleteAll")
    void purge_deletesStaleUnverifiedAccounts() {
        User stale = new User();
        stale.setEmail("nunca-confirmou@x.com");
        stale.setEmailVerified(false);
        when(userRepository.findUnverifiedCreatedBefore(any(LocalDateTime.class)))
                .thenReturn(List.of(stale));

        tokenCleanupService.purgeExpiredAndUsedTokens();

        verify(userRepository).deleteAll(List.of(stale));
    }

    @Test
    @DisplayName("purga completa sem exceção quando tokens são removidos")
    void purge_tokensDeleted_completesWithoutException() {
        when(resetTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class))).thenReturn(5);
        when(verificationTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class))).thenReturn(2);

        tokenCleanupService.purgeExpiredAndUsedTokens();

        verify(resetTokenRepository).deleteExpiredOrUsed(any(LocalDateTime.class));
        verify(verificationTokenRepository).deleteExpiredOrUsed(any(LocalDateTime.class));
    }

    @Test
    @DisplayName("purga propaga exceção do repositório")
    void purge_repositoryThrows_propagatesException() {
        when(resetTokenRepository.deleteExpiredOrUsed(any(LocalDateTime.class)))
                .thenThrow(new RuntimeException("DB error"));

        org.assertj.core.api.Assertions.assertThatThrownBy(
                () -> tokenCleanupService.purgeExpiredAndUsedTokens())
                .isInstanceOf(RuntimeException.class)
                .hasMessage("DB error");
    }
}
