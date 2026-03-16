package com.ebbin.api.repository;

import com.ebbin.api.model.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;

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
}
