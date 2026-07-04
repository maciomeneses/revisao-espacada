package com.ebbin.api.controller;

import com.ebbin.api.dto.LoginRequest;
import com.ebbin.api.dto.LoginResponse;
import com.ebbin.api.dto.PasswordResetRequest;
import com.ebbin.api.dto.RegisterRequest;
import com.ebbin.api.dto.ResetPasswordRequest;
import com.ebbin.api.dto.SignupRequest;
import com.ebbin.api.dto.VerifyEmailRequest;
import com.ebbin.api.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    /**
     * Inicia o fluxo de recuperação de senha.
     *
     * <p>Retorna sempre HTTP 202 (Accepted) com mensagem genérica para prevenir
     * <em>user enumeration</em> (OWASP A07). O corpo da resposta não revela se
     * o e-mail está cadastrado ou não.</p>
     *
     * <p>Rate limiting: protegido pelo {@code EndpointRateLimitFilter} com a chave
     * {@code forgot-password} (3 requisições a cada 10 minutos por IP).</p>
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody PasswordResetRequest req) {
        authService.requestPasswordReset(req);
        return ResponseEntity.accepted().build();
    }

    /**
     * Finaliza o fluxo de reset de senha validando o token e atualizando a senha.
     *
     * <p>O token deve ser válido (existente, não expirado, não usado). Retorna HTTP 200
     * em caso de sucesso ou HTTP 409 se o token for inválido (via GlobalExceptionHandler).
     *
     * <p>Rate limiting: protegido pelo {@code EndpointRateLimitFilter} com a chave
     * {@code reset-password} (5 requisições a cada 15 minutos por IP).</p>
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody ResetPasswordRequest req) {
        authService.resetPassword(req);
        return ResponseEntity.ok().build();
    }

    /** Cadastro restrito a ADMINs autenticados */
    @PostMapping("/register")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    /**
     * Auto-cadastro público com verificação de e-mail (issue #59).
     *
     * <p>Retorna sempre HTTP 202 (Accepted) com corpo vazio, exista ou não o
     * e-mail — anti user-enumeration (OWASP A07). Retorna 403 quando o cadastro
     * público está desabilitado ({@code app.signup.enabled=false}).</p>
     *
     * <p>Rate limiting: {@code EndpointRateLimitFilter}, chave {@code signup}
     * (3 requisições a cada 10 minutos por IP).</p>
     */
    @PostMapping("/signup")
    public ResponseEntity<Void> signup(@Valid @RequestBody SignupRequest req) {
        authService.signup(req);
        return ResponseEntity.accepted().build();
    }

    /**
     * Confirma o e-mail via token e retorna a sessão autenticada (auto-login).
     *
     * <p>Token inválido (inexistente, expirado, já usado) → HTTP 409 via
     * GlobalExceptionHandler, com mensagem genérica.</p>
     *
     * <p>Rate limiting: {@code EndpointRateLimitFilter}, chave
     * {@code verify-email} (5 requisições a cada 15 minutos por IP).</p>
     */
    @PostMapping("/verify-email")
    public ResponseEntity<LoginResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest req) {
        return ResponseEntity.ok(authService.verifyEmail(req));
    }
}
