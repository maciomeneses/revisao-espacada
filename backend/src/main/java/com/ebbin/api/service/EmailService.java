package com.ebbin.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    private final JavaMailSender mailSender;
    private final String fromAddress;

    public EmailService(JavaMailSender mailSender,
                        @Value("${app.mail.from}") String fromAddress) {
        this.mailSender = mailSender;
        this.fromAddress = fromAddress;
    }

    /**
     * Envia o e-mail de redefinição de senha para o usuário.
     *
     * <p>Falhas de envio (SMTP indisponível, credenciais inválidas, etc.) são logadas
     * como erro mas não propagadas — o token já foi salvo e o endpoint retorna 202
     * normalmente. O usuário pode solicitar novo link caso não receba o e-mail.</p>
     *
     * @param to        endereço de e-mail do destinatário
     * @param resetLink URL completa de redefinição de senha com o token
     */
    public void sendPasswordReset(String to, String resetLink) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject("Redefinição de senha — Revisão Espaçada");
            msg.setText("""
                    Você solicitou a redefinição da sua senha.

                    Clique no link abaixo para criar uma nova senha (válido por 15 minutos):

                    %s

                    Se você não solicitou a redefinição, ignore este e-mail.
                    """.formatted(resetLink));
            mailSender.send(msg);
            log.info("E-mail de reset de senha enviado para: {}", to);
        } catch (MailException e) {
            log.error("Falha ao enviar e-mail de reset de senha para {}: {}", to, e.getMessage());
        }
    }
}
