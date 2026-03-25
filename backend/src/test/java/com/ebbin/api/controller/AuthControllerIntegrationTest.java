package com.ebbin.api.controller;

import com.ebbin.api.model.PasswordResetToken;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.PasswordResetTokenRepository;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.EmailService;
import com.ebbin.api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@test.com",
    "app.admin.password=admin123",
    "app.frontend-url=http://localhost:5173",
    // Confia em 127.0.0.1 (remoteAddr do MockMvc) para aceitar X-Forwarded-For nos testes,
    // garantindo isolamento de buckets de rate limit por IP simulado.
    "app.rate-limit.trusted-proxies=127.0.0.1"
})
@Transactional
@DisplayName("AuthController — testes de integração")
class AuthControllerIntegrationTest {

    @MockitoBean
    EmailService emailService;

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordResetTokenRepository resetTokenRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtService jwtService;

    private String adminToken;

    @BeforeEach
    void setUp() {
        User admin = userRepository.findByEmail("admin@test.com")
                .orElseThrow(() -> new IllegalStateException("Admin não criado pelo AdminInitializer"));
        adminToken = jwtService.generateToken(admin.getEmail());
    }

    @Test
    @DisplayName("POST /api/auth/login com credenciais válidas deve retornar 200 com token")
    void login_validCredentials_returns200WithToken() throws Exception {
        // O AdminInitializer cria admin@test.com com admin123 ao iniciar
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "192.168.1.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@test.com","password":"admin123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("admin@test.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/login com credenciais inválidas deve retornar 401")
    void login_invalidCredentials_returns401() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "192.168.1.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@test.com","password":"senhaErrada"}
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("POST /api/auth/login com e-mail inválido deve retornar 400")
    void login_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "192.168.1.3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nao_e_email","password":"senha123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login com senha curta deve retornar 400")
    void login_shortPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "192.168.1.4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"user@test.com","password":"abc"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/register sem autenticação deve retornar 401 ou 403")
    void register_unauthenticated_returns401or403() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header("X-Forwarded-For", "192.168.1.5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"novo@test.com","password":"senha123","role":"USER"}
                                """))
                .andExpect(status().is4xxClientError());
    }

    // ---- forgot-password ----
    // Cada teste usa um IP distinto via X-Forwarded-For para garantir isolamento
    // de buckets de rate limit (o rate limit é por IP × endpoint).

    @Test
    @DisplayName("POST /api/auth/forgot-password com e-mail cadastrado deve retornar 202 e criar token")
    void forgotPassword_existingEmail_returns202AndCreatesToken() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("X-Forwarded-For", "192.168.2.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@test.com"}
                                """))
                .andExpect(status().isAccepted());

        // Verifica que um token foi criado no banco para o usuário
        User admin = userRepository.findByEmail("admin@test.com").orElseThrow();
        long tokenCount = resetTokenRepository.findAll().stream()
                .filter(t -> t.getUser().getId().equals(admin.getId()))
                .count();
        assertThat(tokenCount).isEqualTo(1);
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password com e-mail não cadastrado deve retornar 202 (anti-enumeration)")
    void forgotPassword_unknownEmail_returns202() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("X-Forwarded-For", "192.168.2.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"inexistente@test.com"}
                                """))
                .andExpect(status().isAccepted());
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password com e-mail inválido deve retornar 400")
    void forgotPassword_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("X-Forwarded-For", "192.168.2.3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nao_e_email"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/forgot-password sem corpo deve retornar 400")
    void forgotPassword_emptyEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("X-Forwarded-For", "192.168.2.4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":""}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ---- reset-password ----

    @Test
    @DisplayName("POST /api/auth/reset-password com token válido deve retornar 200 e atualizar senha")
    void resetPassword_validToken_returns200AndUpdatesPassword() throws Exception {
        User admin = userRepository.findByEmail("admin@test.com").orElseThrow();
        String rawToken = UUID.randomUUID().toString();
        LocalDateTime futureExpiry = LocalDateTime.now().plusMinutes(15);
        PasswordResetToken resetToken = new PasswordResetToken(admin, rawToken, futureExpiry);
        resetTokenRepository.save(resetToken);

        mockMvc.perform(post("/api/auth/reset-password")
                        .header("X-Forwarded-For", "192.168.3.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"token":"%s","newPassword":"novaSenha123"}
                                """, rawToken)))
                .andExpect(status().isOk());

        // Verifica que o token foi marcado como usado
        PasswordResetToken updated = resetTokenRepository.findByToken(rawToken).orElseThrow();
        assertThat(updated.isUsed()).isTrue();

        // Verifica que a senha foi atualizada
        User updatedAdmin = userRepository.findByEmail("admin@test.com").orElseThrow();
        assertThat(passwordEncoder.matches("novaSenha123", updatedAdmin.getPassword())).isTrue();
    }

    @Test
    @DisplayName("POST /api/auth/reset-password com token inexistente deve retornar 409")
    void resetPassword_invalidToken_returns409() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .header("X-Forwarded-For", "192.168.3.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"token-que-nao-existe","newPassword":"novaSenha123"}
                                """))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/reset-password com token expirado deve retornar 409")
    void resetPassword_expiredToken_returns409() throws Exception {
        User admin = userRepository.findByEmail("admin@test.com").orElseThrow();
        String rawToken = UUID.randomUUID().toString();
        LocalDateTime pastExpiry = LocalDateTime.now().minusMinutes(1);
        PasswordResetToken resetToken = new PasswordResetToken(admin, rawToken, pastExpiry);
        resetTokenRepository.save(resetToken);

        mockMvc.perform(post("/api/auth/reset-password")
                        .header("X-Forwarded-For", "192.168.3.3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"token":"%s","newPassword":"novaSenha123"}
                                """, rawToken)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/reset-password com token já utilizado deve retornar 409")
    void resetPassword_usedToken_returns409() throws Exception {
        User admin = userRepository.findByEmail("admin@test.com").orElseThrow();
        String rawToken = UUID.randomUUID().toString();
        LocalDateTime futureExpiry = LocalDateTime.now().plusMinutes(15);
        PasswordResetToken resetToken = new PasswordResetToken(admin, rawToken, futureExpiry);
        resetToken.setUsed(true);
        resetTokenRepository.save(resetToken);

        mockMvc.perform(post("/api/auth/reset-password")
                        .header("X-Forwarded-For", "192.168.3.4")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(String.format("""
                                {"token":"%s","newPassword":"novaSenha123"}
                                """, rawToken)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/auth/reset-password com token em branco deve retornar 400")
    void resetPassword_blankToken_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .header("X-Forwarded-For", "192.168.3.5")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"","newPassword":"novaSenha123"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/reset-password com senha curta deve retornar 400")
    void resetPassword_shortPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/auth/reset-password")
                        .header("X-Forwarded-For", "192.168.3.6")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"token":"algum-token","newPassword":"abc"}
                                """))
                .andExpect(status().isBadRequest());
    }

    // ---- POST /api/auth/register ----

    @Test
    @DisplayName("POST /api/auth/register com token ADMIN deve criar usuário e retornar 200")
    void register_asAdmin_returns200WithToken() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header("Authorization", "Bearer " + adminToken)
                        .header("X-Forwarded-For", "192.168.4.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"novo@test.com","password":"senha123","role":"USER"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.email").value("novo@test.com"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    @DisplayName("POST /api/auth/register com e-mail já cadastrado deve retornar 409")
    void register_duplicateEmail_returns409() throws Exception {
        mockMvc.perform(post("/api/auth/register")
                        .header("Authorization", "Bearer " + adminToken)
                        .header("X-Forwarded-For", "192.168.4.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@test.com","password":"senha123","role":"USER"}
                                """))
                .andExpect(status().isConflict());
    }

    // ---- HTTP Security Headers ----

    @Test
    @DisplayName("Respostas devem incluir X-Content-Type-Options, X-Frame-Options, CSP e Referrer-Policy")
    void securityHeaders_presentOnResponse() throws Exception {
        // Nota: Strict-Transport-Security só é enviado em conexões HTTPS; em testes MockMvc
        // (HTTP simples) o Spring Security omite o header HSTS intencionalmente.
        // Os demais headers de segurança devem estar presentes em todas as respostas.
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "192.168.5.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@test.com","password":"admin123"}
                                """))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Content-Type-Options"))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().exists("X-Frame-Options"))
                .andExpect(header().string("X-Frame-Options", "DENY"))
                .andExpect(header().exists("Content-Security-Policy"))
                .andExpect(header().exists("Referrer-Policy"));
    }

    // ---- RFC 9457 para 401/403 do Spring Security ----

    @Test
    @DisplayName("GET /api/subjects sem token deve retornar 401 RFC 9457")
    void unauthenticated_returns401WithProblemDetail() throws Exception {
        mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                        .get("/api/subjects")
                        .header("X-Forwarded-For", "192.168.6.1"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.type").value("urn:problem:unauthorized"))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.title").isNotEmpty())
                .andExpect(jsonPath("$.detail").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/auth/register com token USER deve retornar 403 RFC 9457")
    void accessDenied_returns403WithProblemDetail() throws Exception {
        // Cria um usuário USER para obter token com role USER
        User userRole = new User();
        userRole.setEmail("user-role@test.com");
        userRole.setPassword(passwordEncoder.encode("senha123"));
        userRole.setRole(User.Role.USER);
        userRepository.save(userRole);
        String userToken = jwtService.generateToken(userRole.getEmail());

        // @PreAuthorize dispara AccessDeniedException → capturada pelo GlobalExceptionHandler
        // que retorna ProblemDetail com content-type application/problem+json (RFC 9457 nativo)
        mockMvc.perform(post("/api/auth/register")
                        .header("Authorization", "Bearer " + userToken)
                        .header("X-Forwarded-For", "192.168.6.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"outro@test.com","password":"senha123","role":"USER"}
                                """))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("urn:problem:forbidden"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").isNotEmpty())
                .andExpect(jsonPath("$.detail").isNotEmpty());
    }
}
