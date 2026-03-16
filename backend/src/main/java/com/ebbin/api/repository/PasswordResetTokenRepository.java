package com.ebbin.api.repository;

import com.ebbin.api.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

/**
 * Repositório JPA para {@link PasswordResetToken}.
 *
 * <p>O método {@link #findByToken} é o ponto central de lookup durante a validação
 * do reset de senha — a coluna {@code token} possui índice único no banco (V3 migration).</p>
 */
public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, UUID> {

    /**
     * Busca um token de reset pelo seu valor.
     *
     * @param token valor UUID do token enviado ao usuário
     * @return {@link Optional} com o token encontrado, ou vazio se não existir
     */
    Optional<PasswordResetToken> findByToken(String token);

    /**
     * Remove todos os tokens que já expiraram ou foram utilizados.
     *
     * <p>Executado periodicamente pelo {@link com.ebbin.api.service.TokenCleanupService}
     * para evitar acúmulo indefinido de registros obsoletos na tabela
     * {@code password_reset_tokens}.</p>
     *
     * @param now instante de referência para determinar expiração
     * @return número de registros removidos
     */
    @Modifying
    @Query("DELETE FROM PasswordResetToken t WHERE t.expiresAt < :now OR t.used = true")
    int deleteExpiredOrUsed(@Param("now") LocalDateTime now);
}
