package com.ebbin.api.repository;

import com.ebbin.api.model.EmailVerificationToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para {@link EmailVerificationToken}.
 *
 * <p>Mesmo padrão de {@link PasswordResetTokenRepository}: {@code findByToken}
 * é o lookup central da confirmação (coluna com índice único — V14) e
 * {@code deleteExpiredOrUsed} suporta a purga periódica.</p>
 */
public interface EmailVerificationTokenRepository extends JpaRepository<EmailVerificationToken, UUID> {

    Optional<EmailVerificationToken> findByToken(String token);

    /**
     * Remove todos os tokens de verificação que já expiraram ou foram
     * utilizados. Executado periodicamente pelo
     * {@link com.ebbin.api.service.TokenCleanupService}.
     *
     * @param now instante de referência para determinar expiração
     * @return número de registros removidos
     */
    @Modifying
    @Query("DELETE FROM EmailVerificationToken t WHERE t.expiresAt < :now OR t.used = true")
    int deleteExpiredOrUsed(@Param("now") LocalDateTime now);
}
