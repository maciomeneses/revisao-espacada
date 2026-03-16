package com.ebbin.api.service;

import com.ebbin.api.repository.PasswordResetTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;

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
    private final Clock clock;

    public TokenCleanupService(PasswordResetTokenRepository resetTokenRepository, Clock clock) {
        this.resetTokenRepository = resetTokenRepository;
        this.clock = clock;
    }

    /**
     * Remove tokens de reset expirados ou já utilizados.
     *
     * <p>Executado automaticamente a cada hora (fixedRate = 3600000 ms). A operação é
     * registrada em log com o número de registros removidos para fins de auditoria e
     * monitoramento operacional.</p>
     */
    @Scheduled(fixedRateString = "${app.token-cleanup.fixed-rate-ms:3600000}")
    @Transactional
    public void purgeExpiredAndUsedTokens() {
        LocalDateTime now = LocalDateTime.now(clock);
        int deleted = resetTokenRepository.deleteExpiredOrUsed(now);
        if (deleted > 0) {
            log.info("AUDIT: token-cleanup — {} token(s) de reset expirado(s)/utilizado(s) removidos", deleted);
        } else {
            log.debug("token-cleanup — nenhum token obsoleto encontrado");
        }
    }
}
