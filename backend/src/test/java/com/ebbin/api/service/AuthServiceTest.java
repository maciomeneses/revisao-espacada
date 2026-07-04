package com.ebbin.api.service;

import com.ebbin.api.dto.LoginRequest;
import com.ebbin.api.dto.LoginResponse;
import com.ebbin.api.dto.PasswordResetRequest;
import com.ebbin.api.dto.RegisterRequest;
import com.ebbin.api.dto.ResetPasswordRequest;
import com.ebbin.api.dto.SignupRequest;
import com.ebbin.api.dto.VerifyEmailRequest;
import com.ebbin.api.model.EmailVerificationToken;
import com.ebbin.api.model.PasswordResetToken;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.EmailVerificationTokenRepository;
import com.ebbin.api.repository.PasswordResetTokenRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.contains;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — fluxos de autenticação, registro e reset de senha")
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordResetTokenRepository resetTokenRepository;
    @Mock EmailVerificationTokenRepository verificationTokenRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;
    @Mock EmailService emailService;
    @Mock SubjectCatalogService subjectCatalogService;

    // Relógio fixo para testes determinísticos de TTL
    private static final Instant FIXED_INSTANT = Instant.parse("2026-01-01T10:00:00Z");
    private final Clock fixedClock = Clock.fixed(FIXED_INSTANT, ZoneId.of("UTC"));

    AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        authService = newAuthService(true);

        user = new User();
        user.setEmail("user@test.com");
        user.setPassword("encodedPassword");
        user.setRole(User.Role.USER);
    }

    private AuthService newAuthService(boolean signupEnabled) {
        return new AuthService(
                userRepository,
                resetTokenRepository,
                verificationTokenRepository,
                passwordEncoder,
                jwtService,
                authenticationManager,
                fixedClock,
                "http://localhost:5173",
                signupEnabled,
                emailService,
                subjectCatalogService
        );
    }

    // ---- login ----

    @Test
    @DisplayName("login bem-sucedido deve retornar LoginResponse com token")
    void login_success() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("user@test.com")).thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest("user@test.com", "senha123"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("user@test.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login com credenciais inválidas deve propagar BadCredentialsException")
    void login_invalidCredentials_throwsBadCredentials() {
        doThrow(new BadCredentialsException("Credenciais inválidas"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@test.com", "errada")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("login deve lançar IllegalStateException quando repositório retorna vazio após autenticação bem-sucedida (invariante violado)")
    void login_userNotFoundAfterAuthentication_throwsIllegalState() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@test.com", "senha123")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("user@test.com");
    }

    // ---- register ----

    @Test
    @DisplayName("registro bem-sucedido deve salvar usuário e retornar token")
    void register_success() {
        when(userRepository.existsByEmail("novo@test.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("encodedSenha");
        when(jwtService.generateToken("novo@test.com")).thenReturn("jwt-token");

        User saved = new User();
        saved.setEmail("novo@test.com");
        saved.setPassword("encodedSenha");
        saved.setRole(User.Role.USER);
        when(userRepository.save(any(User.class))).thenReturn(saved);

        LoginResponse response = authService.register(
                new RegisterRequest("novo@test.com", "senha123", User.Role.USER));

        assertThat(response.token()).isEqualTo("jwt-token");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("registro com e-mail duplicado deve lançar IllegalArgumentException")
    void register_duplicateEmail_throwsIllegalArgument() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("user@test.com", "senha123", User.Role.USER)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("E-mail já cadastrado");
    }

    @Test
    @DisplayName("role padrão deve ser USER quando não informada no RegisterRequest")
    void register_defaultRole_isUser() {
        RegisterRequest req = new RegisterRequest("novo@test.com", "senha123", null);
        assertThat(req.role()).isEqualTo(User.Role.USER);
    }

    // ---- requestPasswordReset ----

    @Test
    @DisplayName("requestPasswordReset com e-mail cadastrado deve gerar e salvar token")
    void requestPasswordReset_existingEmail_savesToken() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);
        when(resetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        authService.requestPasswordReset(new PasswordResetRequest("user@test.com"));

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(resetTokenRepository).save(captor.capture());

        PasswordResetToken saved = captor.getValue();
        assertThat(saved.getToken()).isNotBlank();
        assertThat(saved.getUser()).isEqualTo(user);
        // expiresAt deve ser agora + 15 minutos (usando relógio fixo)
        LocalDateTime expectedExpiry = LocalDateTime.now(fixedClock).plusMinutes(15);
        assertThat(saved.getExpiresAt()).isEqualTo(expectedExpiry);
        assertThat(saved.isUsed()).isFalse();
    }

    @Test
    @DisplayName("requestPasswordReset com e-mail cadastrado deve enviar e-mail com link de reset")
    void requestPasswordReset_existingEmail_sendsEmail() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);
        when(resetTokenRepository.save(any(PasswordResetToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        authService.requestPasswordReset(new PasswordResetRequest("user@test.com"));

        verify(emailService).sendPasswordReset(eq("user@test.com"),
                contains("/reset-password?token="));
    }

    @Test
    @DisplayName("requestPasswordReset com e-mail não cadastrado NÃO deve enviar e-mail (anti-user-enumeration)")
    void requestPasswordReset_unknownEmail_doesNotSendEmail() {
        when(userRepository.findByEmail("inexistente@test.com")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("inexistente@test.com")).thenReturn(false);

        authService.requestPasswordReset(new PasswordResetRequest("inexistente@test.com"));

        verify(emailService, never()).sendPasswordReset(any(), any());
    }

    @Test
    @DisplayName("requestPasswordReset com e-mail não cadastrado NÃO deve salvar token (anti-user-enumeration)")
    void requestPasswordReset_unknownEmail_doesNotSaveToken() {
        when(userRepository.findByEmail("inexistente@test.com")).thenReturn(Optional.empty());
        when(userRepository.existsByEmail("inexistente@test.com")).thenReturn(false);

        authService.requestPasswordReset(new PasswordResetRequest("inexistente@test.com"));

        verify(resetTokenRepository, never()).save(any());
    }

    @Test
    @DisplayName("requestPasswordReset deve completar sem lançar exceção independente do e-mail (anti-user-enumeration)")
    void requestPasswordReset_alwaysCompletesWithoutException() {
        when(userRepository.findByEmail(anyString())).thenReturn(Optional.empty());
        when(userRepository.existsByEmail(anyString())).thenReturn(false);

        authService.requestPasswordReset(new PasswordResetRequest("qualquer@test.com"));
        // Sem exceção — resposta genérica sempre
    }

    // ---- resetPassword ----

    @Test
    @DisplayName("resetPassword com token válido deve atualizar senha e marcar token como usado")
    void resetPassword_validToken_updatesPasswordAndMarksUsed() {
        String rawToken = UUID.randomUUID().toString();
        LocalDateTime futureExpiry = LocalDateTime.now(fixedClock).plusMinutes(10);

        PasswordResetToken resetToken = new PasswordResetToken(user, rawToken, futureExpiry);
        when(resetTokenRepository.findByToken(rawToken)).thenReturn(Optional.of(resetToken));
        when(passwordEncoder.encode("novaSenha")).thenReturn("encodedNovaSenha");
        when(userRepository.save(any(User.class))).thenReturn(user);
        when(resetTokenRepository.save(any(PasswordResetToken.class))).thenAnswer(inv -> inv.getArgument(0));

        authService.resetPassword(new ResetPasswordRequest(rawToken, "novaSenha"));

        verify(passwordEncoder).encode("novaSenha");
        verify(userRepository).save(user);
        assertThat(user.getPassword()).isEqualTo("encodedNovaSenha");

        ArgumentCaptor<PasswordResetToken> captor = ArgumentCaptor.forClass(PasswordResetToken.class);
        verify(resetTokenRepository).save(captor.capture());
        assertThat(captor.getValue().isUsed()).isTrue();
    }

    @Test
    @DisplayName("resetPassword com token inexistente deve lançar IllegalArgumentException")
    void resetPassword_tokenNotFound_throwsIllegalArgument() {
        when(resetTokenRepository.findByToken("token-invalido")).thenReturn(Optional.empty());

        assertThatThrownBy(() ->
                authService.resetPassword(new ResetPasswordRequest("token-invalido", "novaSenha")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Token de reset inválido ou expirado");
    }

    @Test
    @DisplayName("resetPassword com token já utilizado deve lançar IllegalArgumentException")
    void resetPassword_tokenAlreadyUsed_throwsIllegalArgument() {
        String rawToken = UUID.randomUUID().toString();
        LocalDateTime futureExpiry = LocalDateTime.now(fixedClock).plusMinutes(10);

        PasswordResetToken resetToken = new PasswordResetToken(user, rawToken, futureExpiry);
        resetToken.setUsed(true); // já consumido
        when(resetTokenRepository.findByToken(rawToken)).thenReturn(Optional.of(resetToken));

        assertThatThrownBy(() ->
                authService.resetPassword(new ResetPasswordRequest(rawToken, "novaSenha")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Token de reset inválido ou expirado");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword com token expirado deve lançar IllegalArgumentException")
    void resetPassword_expiredToken_throwsIllegalArgument() {
        String rawToken = UUID.randomUUID().toString();
        // expirado há 1 minuto em relação ao relógio fixo
        LocalDateTime pastExpiry = LocalDateTime.now(fixedClock).minusMinutes(1);

        PasswordResetToken resetToken = new PasswordResetToken(user, rawToken, pastExpiry);
        when(resetTokenRepository.findByToken(rawToken)).thenReturn(Optional.of(resetToken));

        assertThatThrownBy(() ->
                authService.resetPassword(new ResetPasswordRequest(rawToken, "novaSenha")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Token de reset inválido ou expirado");

        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("resetPassword deve rejeitar token expirado mesmo que não esteja marcado como usado")
    void resetPassword_expiredUnusedToken_throwsIllegalArgument() {
        String rawToken = UUID.randomUUID().toString();
        LocalDateTime pastExpiry = LocalDateTime.now(fixedClock).minusSeconds(1);

        PasswordResetToken resetToken = new PasswordResetToken(user, rawToken, pastExpiry);
        // used = false, mas expirado
        when(resetTokenRepository.findByToken(rawToken)).thenReturn(Optional.of(resetToken));

        assertThatThrownBy(() ->
                authService.resetPassword(new ResetPasswordRequest(rawToken, "qualquerSenha")))
                .isInstanceOf(IllegalArgumentException.class);

        verify(resetTokenRepository, never()).save(any());
    }

    // ---- maskToken ----

    @Test
    @DisplayName("maskToken deve exibir apenas os primeiros 8 caracteres seguidos de '***'")
    void maskToken_longToken_returnsPrefix() {
        String result = AuthService.maskToken("abcdefgh-1234-5678-abcd-000000000000");
        assertThat(result).isEqualTo("abcdefgh***");
    }

    @Test
    @DisplayName("maskToken com token de exatamente 8 caracteres deve retornar '***'")
    void maskToken_exactly8Chars_returnsMasked() {
        String result = AuthService.maskToken("12345678");
        assertThat(result).isEqualTo("***");
    }

    @Test
    @DisplayName("maskToken com token curto deve retornar '***'")
    void maskToken_shortToken_returnsMasked() {
        assertThat(AuthService.maskToken("abc")).isEqualTo("***");
    }

    @Test
    @DisplayName("maskToken com token nulo deve retornar '***'")
    void maskToken_nullToken_returnsMasked() {
        assertThat(AuthService.maskToken(null)).isEqualTo("***");
    }

    // ---- signup (auto-cadastro público, issue #59) ----

    @Test
    @DisplayName("signup com cadastro desabilitado lança 403")
    void signup_disabled_throws403() {
        AuthService disabledService = newAuthService(false);

        assertThatThrownBy(() -> disabledService.signup(new SignupRequest("novo@test.com", "senha123x")))
                .isInstanceOf(org.springframework.web.server.ResponseStatusException.class)
                .hasMessageContaining("desabilitado");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("signup com e-mail novo cria conta USER não verificada, semeia catálogo e envia link")
    void signup_newEmail_createsUnverifiedUser() {
        when(userRepository.findByEmail("novo@test.com")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("senha123x")).thenReturn("encodedSenha");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(verificationTokenRepository.save(any(EmailVerificationToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        authService.signup(new SignupRequest("novo@test.com", "senha123x"));

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User saved = userCaptor.getValue();
        assertThat(saved.getEmail()).isEqualTo("novo@test.com");
        assertThat(saved.getPassword()).isEqualTo("encodedSenha");
        assertThat(saved.getRole()).isEqualTo(User.Role.USER);
        assertThat(saved.isEmailVerified()).isFalse();

        verify(subjectCatalogService).seedDefaults(saved);

        ArgumentCaptor<EmailVerificationToken> tokenCaptor =
                ArgumentCaptor.forClass(EmailVerificationToken.class);
        verify(verificationTokenRepository).save(tokenCaptor.capture());
        EmailVerificationToken token = tokenCaptor.getValue();
        assertThat(token.getToken()).isNotBlank();
        assertThat(token.isUsed()).isFalse();
        assertThat(token.getExpiresAt())
                .isEqualTo(LocalDateTime.now(fixedClock).plusMinutes(24 * 60));

        verify(emailService).sendEmailVerification(eq("novo@test.com"),
                contains("/?verify=" + token.getToken()));
    }

    @Test
    @DisplayName("signup com conta existente não verificada reenvia o link sem criar usuário")
    void signup_existingUnverified_resendsToken() {
        user.setEmailVerified(false);
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(verificationTokenRepository.save(any(EmailVerificationToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));

        authService.signup(new SignupRequest("user@test.com", "senha123x"));

        verify(userRepository, never()).save(any(User.class));
        verify(subjectCatalogService, never()).seedDefaults(any());
        verify(verificationTokenRepository).save(any(EmailVerificationToken.class));
        verify(emailService).sendEmailVerification(eq("user@test.com"), anyString());
    }

    @Test
    @DisplayName("signup com conta já verificada não cria usuário nem envia e-mail (anti-user-enumeration)")
    void signup_existingVerified_silentNoop() {
        user.setEmailVerified(true);
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        authService.signup(new SignupRequest("user@test.com", "senha123x"));

        verify(userRepository, never()).save(any(User.class));
        verify(verificationTokenRepository, never()).save(any(EmailVerificationToken.class));
        verify(emailService, never()).sendEmailVerification(anyString(), anyString());
    }

    // ---- verifyEmail ----

    @Test
    @DisplayName("verifyEmail com token válido confirma o e-mail, consome o token e retorna sessão")
    void verifyEmail_validToken_verifiesAndLogsIn() {
        user.setEmailVerified(false);
        EmailVerificationToken token = new EmailVerificationToken(
                user, "valid-token", LocalDateTime.now(fixedClock).plusHours(1));
        when(verificationTokenRepository.findByToken("valid-token")).thenReturn(Optional.of(token));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(verificationTokenRepository.save(any(EmailVerificationToken.class)))
                .thenAnswer(inv -> inv.getArgument(0));
        when(jwtService.generateToken("user@test.com")).thenReturn("jwt-token");

        LoginResponse response = authService.verifyEmail(new VerifyEmailRequest("valid-token"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("user@test.com");
        assertThat(user.isEmailVerified()).isTrue();
        assertThat(token.isUsed()).isTrue();
    }

    @Test
    @DisplayName("verifyEmail com token inexistente lança IllegalArgumentException")
    void verifyEmail_unknownToken_throws() {
        when(verificationTokenRepository.findByToken("nope")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("nope")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inválido ou expirado");
    }

    @Test
    @DisplayName("verifyEmail com token já utilizado lança IllegalArgumentException")
    void verifyEmail_usedToken_throws() {
        EmailVerificationToken token = new EmailVerificationToken(
                user, "used-token", LocalDateTime.now(fixedClock).plusHours(1));
        token.setUsed(true);
        when(verificationTokenRepository.findByToken("used-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("used-token")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inválido ou expirado");
    }

    @Test
    @DisplayName("verifyEmail com token expirado lança IllegalArgumentException")
    void verifyEmail_expiredToken_throws() {
        EmailVerificationToken token = new EmailVerificationToken(
                user, "expired-token", LocalDateTime.now(fixedClock).minusMinutes(1));
        when(verificationTokenRepository.findByToken("expired-token")).thenReturn(Optional.of(token));

        assertThatThrownBy(() -> authService.verifyEmail(new VerifyEmailRequest("expired-token")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("inválido ou expirado");
        assertThat(user.isEmailVerified()).isTrue(); // default de conta pré-existente não muda
    }
}
