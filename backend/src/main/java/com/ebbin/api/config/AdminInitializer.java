package com.ebbin.api.config;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Inicializador do usuário administrador padrão.
 *
 * <p><strong>Nota de segurança (auditoria):</strong> este bean cria o admin inicial com a
 * senha definida em {@code app.admin.password} (default: {@code admin123}). Em produção:
 * <ul>
 *   <li>Defina {@code ADMIN_PASSWORD} via variável de ambiente com uma senha forte e única.</li>
 *   <li>O {@link ProductionConfigValidator} garante que o default inseguro não seja aceito
 *       no perfil {@code prod}.</li>
 *   <li>Após o primeiro deploy, altere a senha via painel administrativo e invalide
 *       quaisquer sessões ativas.</li>
 * </ul>
 * A classe é excluída da verificação JaCoCo (infraestrutura sem lógica de negócio testável).
 * </p>
 */
@Configuration
public class AdminInitializer {

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    @Value("${app.admin.email:admin@ebbin.com}")
    private String adminEmail;

    @Value("${app.admin.password:admin123}")
    private String adminPassword;

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail(adminEmail).isEmpty()) {
                User admin = new User();
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
                log.warn(
                    "[SECURITY AUDIT] Usuário administrador inicial criado com email={}. " +
                    "AÇÃO OBRIGATÓRIA: altere a senha imediatamente via painel admin e " +
                    "certifique-se de que ADMIN_PASSWORD está configurado via variável de ambiente segura.",
                    adminEmail);
            } else {
                log.debug("Usuário administrador já existe: email={}", adminEmail);
            }
        };
    }
}
