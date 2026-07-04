package com.ebbin.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private static final String BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email";

    private final String apiKey;
    private final String fromAddress;
    private final RestClient restClient;

    public EmailService(@Value("${app.mail.brevo-api-key:}") String apiKey,
                        @Value("${app.mail.from}") String fromAddress) {
        this.apiKey = apiKey;
        this.fromAddress = fromAddress;
        this.restClient = RestClient.create();
    }

    /**
     * Envia o e-mail de redefinição de senha via API REST do Brevo.
     *
     * <p>Se {@code BREVO_API_KEY} não estiver configurada (ex: ambiente de dev),
     * o envio é ignorado e um aviso é logado. Falhas de API são capturadas e logadas
     * sem propagar exceção — o token já foi salvo e o endpoint retorna 202 normalmente.</p>
     *
     * @param to        endereço de e-mail do destinatário
     * @param resetLink URL completa de redefinição de senha com o token
     */
    public void sendPasswordReset(String to, String resetLink) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("BREVO_API_KEY não configurada — e-mail de reset não enviado para: {}", to);
            return;
        }
        try {
            Map<String, Object> body = Map.of(
                "sender", Map.of("email", fromAddress, "name", "Revisão Espaçada"),
                "to", List.of(Map.of("email", to)),
                "subject", "Redefinição de senha — Revisão Espaçada",
                "textContent", """
                        Você solicitou a redefinição da sua senha.

                        Clique no link abaixo para criar uma nova senha (válido por 15 minutos):

                        %s

                        Se você não solicitou a redefinição, ignore este e-mail.
                        """.formatted(resetLink)
            );

            restClient.post()
                .uri(BREVO_SEND_URL)
                .header("api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();

            log.info("E-mail de reset de senha enviado para: {}", to);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de reset de senha para {}: {}", to, e.getMessage());
        }
    }

    /**
     * Envia o e-mail de confirmação de cadastro via API REST do Brevo.
     *
     * <p>Mesmo contrato de {@link #sendPasswordReset}: sem {@code BREVO_API_KEY}
     * o envio é ignorado com aviso em log; falhas de API são logadas sem
     * propagar exceção — o token já foi salvo e o endpoint responde 202.</p>
     *
     * @param to         endereço de e-mail do destinatário
     * @param verifyLink URL completa de confirmação com o token
     */
    public void sendEmailVerification(String to, String verifyLink) {
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("BREVO_API_KEY não configurada — e-mail de verificação não enviado para: {}", to);
            return;
        }
        try {
            Map<String, Object> body = Map.of(
                "sender", Map.of("email", fromAddress, "name", "Revisão Espaçada"),
                "to", List.of(Map.of("email", to)),
                "subject", "Confirme seu e-mail — Revisão Espaçada",
                "textContent", """
                        Bem-vindo(a) à Revisão Espaçada!

                        Clique no link abaixo para confirmar seu e-mail e ativar sua conta (válido por 24 horas):

                        %s

                        Se você não criou esta conta, ignore este e-mail.
                        """.formatted(verifyLink)
            );

            restClient.post()
                .uri(BREVO_SEND_URL)
                .header("api-key", apiKey)
                .contentType(MediaType.APPLICATION_JSON)
                .body(body)
                .retrieve()
                .toBodilessEntity();

            log.info("E-mail de verificação enviado para: {}", to);
        } catch (Exception e) {
            log.error("Falha ao enviar e-mail de verificação para {}: {}", to, e.getMessage());
        }
    }
}
