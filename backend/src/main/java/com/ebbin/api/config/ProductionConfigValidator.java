package com.ebbin.api.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * Validador de configuração obrigatória para o perfil de produção.
 *
 * <p>Garante que variáveis de ambiente críticas para segurança sejam definidas
 * explicitamente antes que a aplicação aceite tráfego. Se qualquer variável obrigatória
 * estiver ausente (i.e., usando o valor default de desenvolvimento), a aplicação falha
 * imediatamente na fase de inicialização com uma mensagem clara (fail-fast).</p>
 *
 * <p>Variáveis validadas:
 * <ul>
 *   <li>{@code JWT_SECRET} — chave de assinatura dos tokens JWT; o default de desenvolvimento
 *       é publicamente conhecido e <strong>inseguro</strong> em produção. Além disso, o segredo
 *       deve ter no mínimo {@value #JWT_SECRET_MIN_LENGTH} caracteres (256 bits) para que o
 *       algoritmo HS256 opere com entropia adequada conforme RFC 7518 §3.2.</li>
 *   <li>{@code ADMIN_PASSWORD} — senha inicial do administrador; o default {@code admin123}
 *       é trivialmente adivinhável e não deve ser aceito em produção.</li>
 * </ul>
 * </p>
 *
 * <p>Este componente é ativado exclusivamente pelo perfil {@code prod}
 * ({@code SPRING_PROFILES_ACTIVE=prod}), não interferindo em ambientes de desenvolvimento
 * ou testes.</p>
 *
 * <p>Mitigação OWASP A05 — Security Misconfiguration.</p>
 */
@Component
@Profile("prod")
public class ProductionConfigValidator {

    private static final Logger log = LoggerFactory.getLogger(ProductionConfigValidator.class);

    /**
     * Comprimento mínimo exigido para o JWT_SECRET em caracteres.
     *
     * <p>O algoritmo HMAC-SHA256 (HS256) requer chaves com entropia mínima de 256 bits.
     * Assumindo codificação ASCII/UTF-8 onde cada caractere contribui com ao menos 1 byte
     * (8 bits), são necessários pelo menos 32 caracteres (32 × 8 = 256 bits).
     * Conforme RFC 7518 §3.2, chaves abaixo deste limiar são consideradas inseguras.</p>
     */
    static final int JWT_SECRET_MIN_LENGTH = 32;

    /**
     * Valor padrão inseguro do JWT_SECRET, usado apenas em desenvolvimento.
     * Em produção, qualquer ausência de configuração explícita deve ser tratada como falha.
     */
    static final String INSECURE_JWT_DEFAULT =
            "TroqueEssaChaveEmProducaoComNoMinimo256BitsParaSegurancaAdequadaEmAmbienteRailway";

    /** Valor padrão inseguro do ADMIN_PASSWORD, usado apenas em desenvolvimento. */
    static final String INSECURE_ADMIN_PASSWORD_DEFAULT = "admin123";

    private final String jwtSecret;
    private final String adminPassword;

    public ProductionConfigValidator(
            @Value("${app.jwt.secret}") String jwtSecret,
            @Value("${app.admin.password}") String adminPassword) {
        this.jwtSecret = jwtSecret;
        this.adminPassword = adminPassword;
    }

    /**
     * Valida as configurações críticas de segurança imediatamente após a criação do bean.
     * Lança {@link IllegalStateException} se qualquer variável obrigatória não estiver
     * configurada com um valor seguro, impedindo a inicialização da aplicação.
     */
    @PostConstruct
    public void validate() {
        StringBuilder errors = new StringBuilder();

        if (jwtSecret == null || jwtSecret.isBlank() || INSECURE_JWT_DEFAULT.equals(jwtSecret)) {
            errors.append("[FATAL] JWT_SECRET não está configurado ou usa o valor default inseguro. ")
                  .append("Defina a variável de ambiente JWT_SECRET com uma chave aleatória de no mínimo 256 bits. ");
        } else if (jwtSecret.length() < JWT_SECRET_MIN_LENGTH) {
            errors.append("[FATAL] JWT_SECRET possui apenas ").append(jwtSecret.length())
                  .append(" caracteres, abaixo do mínimo de ").append(JWT_SECRET_MIN_LENGTH)
                  .append(" exigido para garantir 256 bits de entropia (RFC 7518 §3.2). ");
        }

        if (adminPassword == null || adminPassword.isBlank() || INSECURE_ADMIN_PASSWORD_DEFAULT.equals(adminPassword)) {
            errors.append("[FATAL] ADMIN_PASSWORD não está configurado ou usa o valor default inseguro ('admin123'). ")
                  .append("Defina a variável de ambiente ADMIN_PASSWORD com uma senha forte. ");
        }

        if (!errors.isEmpty()) {
            String message = "Configuração de produção inválida — falha de segurança detectada na inicialização: "
                    + errors.toString().trim();
            log.error(message);
            throw new IllegalStateException(message);
        }

        log.info("Validação de configuração de produção concluída com sucesso.");
    }
}
