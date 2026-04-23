package com.ebbin.api.service;

import com.ebbin.api.dto.LoginRequest;
import com.ebbin.api.dto.LoginResponse;
import com.ebbin.api.dto.PasswordResetRequest;
import com.ebbin.api.dto.RegisterRequest;
import com.ebbin.api.dto.ResetPasswordRequest;
import com.ebbin.api.model.PasswordResetToken;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.PasswordResetTokenRepository;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    /** TTL do token de reset em minutos. */
    private static final int RESET_TOKEN_TTL_MINUTES = 15;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository resetTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final Clock clock;
    private final String frontendUrl;
    private final EmailService emailService;
    private final SubjectCatalogService subjectCatalogService;

    public AuthService(UserRepository userRepository,
                       PasswordResetTokenRepository resetTokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtService jwtService,
                       AuthenticationManager authenticationManager,
                       Clock clock,
                       @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl,
                       EmailService emailService,
                       SubjectCatalogService subjectCatalogService) {
        this.userRepository = userRepository;
        this.resetTokenRepository = resetTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.clock = clock;
        this.frontendUrl = frontendUrl;
        this.emailService = emailService;
        this.subjectCatalogService = subjectCatalogService;
    }

    public LoginResponse login(LoginRequest req) {
        log.info("Tentativa de login: email={}", req.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));

        // Guarda defensiva: se a autenticação acima foi bem-sucedida, o usuário DEVE existir
        // no repositório (UserDetailsServiceImpl já o carregou). Este estado é estruturalmente
        // impossível em operação normal; IllegalStateException sinaliza violação de invariante.
        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new IllegalStateException(
                        "Inconsistência de dados: usuário autenticado não encontrado no repositório: " + req.email()));

        String token = jwtService.generateToken(user.getEmail());
        log.info("Login bem-sucedido: email={}, role={}", user.getEmail(), user.getRole());
        return LoginResponse.of(token, user);
    }

    /**
     * Inicia o fluxo de recuperação de senha.
     *
     * <p><b>Segurança (OWASP A07):</b> a resposta é sempre idêntica independente de o e-mail
     * estar cadastrado ou não — isso previne <em>user enumeration</em> (enumeração de usuários).
     *
     * <p>Configure {@code app.frontend-url} e {@code BREVO_SMTP_*} via variáveis de ambiente
     * para que o link de reset seja enviado por e-mail transacional via Brevo.</p>
     *
     * @param req payload contendo o e-mail solicitante
     */
    @Transactional
    public void requestPasswordReset(PasswordResetRequest req) {
        log.info("AUDIT: forgot-password solicitado: email={}", req.email());

        // Verifica existência sem expor resultado ao chamador (anti-user-enumeration)
        userRepository.findByEmail(req.email()).ifPresent(user -> {
            String rawToken = UUID.randomUUID().toString();
            LocalDateTime expiresAt = LocalDateTime.now(clock).plusMinutes(RESET_TOKEN_TTL_MINUTES);
            PasswordResetToken resetToken = new PasswordResetToken(user, rawToken, expiresAt);
            resetTokenRepository.save(resetToken);

            String resetLink = frontendUrl + "/reset-password?token=" + rawToken;
            log.info("AUDIT: reset-password token gerado: email={}, tokenPrefix={}",
                    user.getEmail(), maskToken(rawToken));
            emailService.sendPasswordReset(user.getEmail(), resetLink);
        });

        if (!userRepository.existsByEmail(req.email())) {
            log.warn("AUDIT: forgot-password — e-mail não cadastrado (resposta genérica para evitar user-enumeration): email={}", req.email());
        }

        // Resposta deliberadamente genérica — não revela se o e-mail existe
    }

    /**
     * Executa o reset de senha utilizando um token previamente emitido.
     *
     * <p>O token é validado quanto à existência, expiração e uso prévio. Se válido, a senha
     * é atualizada e o token é marcado como usado (uso único). Em caso de token inválido,
     * uma {@link IllegalArgumentException} é lançada — mapeada pelo
     * {@link com.ebbin.api.exception.GlobalExceptionHandler} para HTTP 409.</p>
     *
     * <p><b>Segurança:</b> a mensagem de erro é genérica para não revelar qual condição
     * (inexistente, expirado, já usado) falhou — OWASP A07.</p>
     *
     * @param req payload contendo o token e a nova senha
     * @throws IllegalArgumentException se o token for inválido (inexistente, expirado ou já usado)
     */
    @Transactional
    public void resetPassword(ResetPasswordRequest req) {
        log.info("AUDIT: reset-password tentativa com tokenPrefix={}", maskToken(req.token()));

        PasswordResetToken resetToken = resetTokenRepository.findByToken(req.token())
                .orElseThrow(() -> {
                    log.warn("AUDIT: reset-password — token não encontrado: tokenPrefix={}", maskToken(req.token()));
                    return new IllegalArgumentException("Token de reset inválido ou expirado");
                });

        if (resetToken.isUsed()) {
            log.warn("AUDIT: reset-password — token já utilizado: tokenPrefix={}, userId={}",
                    maskToken(req.token()), resetToken.getUser().getId());
            throw new IllegalArgumentException("Token de reset inválido ou expirado");
        }

        if (LocalDateTime.now(clock).isAfter(resetToken.getExpiresAt())) {
            log.warn("AUDIT: reset-password — token expirado: tokenPrefix={}, expiresAt={}, userId={}",
                    maskToken(req.token()), resetToken.getExpiresAt(), resetToken.getUser().getId());
            throw new IllegalArgumentException("Token de reset inválido ou expirado");
        }

        // Token válido: atualiza senha e invalida o token
        User user = resetToken.getUser();
        user.setPassword(passwordEncoder.encode(req.newPassword()));
        userRepository.save(user);

        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        log.info("AUDIT: reset-password bem-sucedido: userId={}, email={}", user.getId(), user.getEmail());
    }

    /**
     * Mascara o token para uso em logs, exibindo apenas os primeiros 8 caracteres seguidos de "***".
     * Evita o vazamento do UUID completo em sistemas de agregação de logs (OWASP A09).
     */
    static String maskToken(String token) {
        if (token == null || token.length() <= 8) return "***";
        return token.substring(0, 8) + "***";
    }

    @Transactional
    public LoginResponse register(RegisterRequest req) {
        log.info("Cadastro de usuário: email={}, role={}", req.email(), req.role());
        if (userRepository.existsByEmail(req.email())) {
            log.warn("Tentativa de cadastro com e-mail duplicado: {}", req.email());
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        User user = new User();
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(req.role());
        user = userRepository.save(user);

        // Semeia o catálogo ENEM (4 áreas + 9 disciplinas) para o novo usuário,
        // espelhando o seed idempotente do V10 aplicado aos usuários pré-existentes.
        subjectCatalogService.seedDefaults(user);

        log.info("Usuário criado com sucesso: email={}, role={}", user.getEmail(), user.getRole());
        String token = jwtService.generateToken(user.getEmail());
        return LoginResponse.of(token, user);
    }
}
