package com.ebbin.api.service;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.EmailVerificationTokenRepository;
import com.ebbin.api.repository.PasswordResetTokenRepository;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Serviço de limpeza periódica de tokens de reset de senha obsoletos.
 *
 * <p>Tokens de reset são consumidos (marcados como {@code used = true}) ou expiram
 * automaticamente após 15 minutos ({@code expires_at}), mas o registro permanece na
 * tabela {@code password_reset_tokens}. Sem uma rotina de purga, esses registros
 * acumulam indefinidamente, gerando crescimento desnecessário do banco de dados.</p>
 *
 * <p>Esta task executa a cada hora (configurável via {@code app.token-cleanup.cron}) e
 * remove todos os tokens que já expiraram <em>ou</em> foram utilizados, mantendo a
 * tabela enxuta e prevenindo varredura desnecessária de dados obsoletos.</p>
 *
 * <p>O {@link Clock} injetado permite substituição por um relógio fixo em testes
 * unitários, garantindo comportamento determinístico.</p>
 */
@Service
public class TokenCleanupService {

    private static final Logger log = LoggerFactory.getLogger(TokenCleanupService.class);

    private final PasswordResetTokenRepository resetTokenRepository;
    private final EmailVerificationTokenRepository verificationTokenRepository;
    private final UserRepository userRepository;
    private final Clock clock;
    private final int unverifiedTtlHours;

    public TokenCleanupService(PasswordResetTokenRepository resetTokenRepository,
                               EmailVerificationTokenRepository verificationTokenRepository,
                               UserRepository userRepository,
                               @Value("${app.signup.unverified-ttl-hours:48}") int unverifiedTtlHours,
                               Clock clock) {
        this.resetTokenRepository = resetTokenRepository;
        this.verificationTokenRepository = verificationTokenRepository;
        this.userRepository = userRepository;
        this.unverifiedTtlHours = unverifiedTtlHours;
        this.clock = clock;
    }

    /**
     * Remove tokens de reset/verificação expirados ou já utilizados e purga
     * contas de self-signup nunca confirmadas além do TTL
     * ({@code app.signup.unverified-ttl-hours}, padrão 48h).
     *
     * <p>Executado automaticamente a cada hora (fixedRate = 3600000 ms). A operação é
     * registrada em log com o número de registros removidos para fins de auditoria e
     * monitoramento operacional.</p>
     *
     * <p>A purga de contas usa {@code deleteAll} entidade a entidade (não bulk
     * JPQL) para que os cascades de banco (subjects, áreas, tokens etc.) sejam
     * respeitados em qualquer schema.</p>
     */
    @Scheduled(fixedRateString = "${app.token-cleanup.fixed-rate-ms:3600000}")
    @Transactional
    public void purgeExpiredAndUsedTokens() {
        LocalDateTime now = LocalDateTime.now(clock);

        int deleted = resetTokenRepository.deleteExpiredOrUsed(now);
        if (deleted > 0) {
            log.info("AUDIT: token-cleanup — {} token(s) de reset expirado(s)/utilizado(s) removidos", deleted);
        }

        int deletedVerification = verificationTokenRepository.deleteExpiredOrUsed(now);
        if (deletedVerification > 0) {
            log.info("AUDIT: token-cleanup — {} token(s) de verificação expirado(s)/utilizado(s) removidos",
                    deletedVerification);
        }

        List<User> staleUnverified = userRepository.findUnverifiedCreatedBefore(
                now.minusHours(unverifiedTtlHours));
        if (!staleUnverified.isEmpty()) {
            userRepository.deleteAll(staleUnverified);
            log.info("AUDIT: token-cleanup — {} conta(s) não verificada(s) além de {}h removida(s)",
                    staleUnverified.size(), unverifiedTtlHours);
        }

        if (deleted == 0 && deletedVerification == 0 && staleUnverified.isEmpty()) {
            log.debug("token-cleanup — nenhum registro obsoleto encontrado");
        }
    }
}
