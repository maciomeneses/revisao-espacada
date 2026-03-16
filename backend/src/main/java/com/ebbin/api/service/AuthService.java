package com.ebbin.api.service;

import com.ebbin.api.dto.LoginRequest;
import com.ebbin.api.dto.LoginResponse;
import com.ebbin.api.dto.PasswordResetRequest;
import com.ebbin.api.dto.RegisterRequest;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
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
     * Em produção, este método deve delegar o envio do e-mail para um serviço de mensageria
     * assíncrono (e.g., AWS SES, SendGrid) com um token de reset de uso único.</p>
     *
     * <p><b>TODO (pendência de implementação):</b>
     * <ol>
     *   <li>Gerar token de reset único (UUID v4) com TTL de 1 hora e persistir em tabela {@code password_reset_tokens}.</li>
     *   <li>Enviar e-mail transacional via serviço de mensageria (AWS SES / SendGrid) com link de reset.</li>
     *   <li>Implementar endpoint {@code POST /api/auth/reset-password} que valida o token e atualiza a senha.</li>
     *   <li>Invalidar token após uso único e expirar automaticamente os vencidos via job agendado.</li>
     * </ol>
     * Enquanto não implementado, o endpoint responde 202 sem enviar e-mail — fluxo é stub intencional.</p>
     *
     * @param req payload contendo o e-mail solicitante
     */
    public void requestPasswordReset(PasswordResetRequest req) {
        log.info("AUDIT: forgot-password solicitado: email={}", req.email());
        // Verifica existência sem expor resultado ao chamador (anti-user-enumeration)
        boolean exists = userRepository.existsByEmail(req.email());
        if (exists) {
            // TODO: gerar token de reset único + enviar e-mail via serviço de mensageria
            log.warn("AUDIT: forgot-password stub — e-mail de reset NÃO enviado (implementação pendente): email={}", req.email());
        } else {
            log.warn("AUDIT: forgot-password — e-mail não cadastrado (resposta genérica para evitar user-enumeration): email={}", req.email());
        }
        // Resposta deliberadamente genérica — não revela se o e-mail existe
    }

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
        userRepository.save(user);

        log.info("Usuário criado com sucesso: email={}, role={}", user.getEmail(), user.getRole());
        String token = jwtService.generateToken(user.getEmail());
        return LoginResponse.of(token, user);
    }
}
