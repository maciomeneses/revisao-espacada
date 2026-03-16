package com.ebbin.api.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes de integração para o {@link EndpointRateLimitFilter}.
 *
 * <p>Cada teste usa um IP diferente via X-Forwarded-For para garantir isolamento —
 * o bucket é por IP×endpoint, portanto IPs distintos partem sempre com o token cheio.</p>
 *
 * Capacidade configurada = 3 requisições/60 min por IP para ambos os endpoints.
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:ratelimittest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@ratelimit.com",
    "app.admin.password=admin123",
    // Configuração legada (retrocompatibilidade)
    "app.rate-limit.capacity=3",
    "app.rate-limit.refill-tokens=3",
    "app.rate-limit.refill-minutes=60",
    // Configuração por endpoint
    "app.rate-limit.endpoints.login.capacity=3",
    "app.rate-limit.endpoints.login.refill-tokens=3",
    "app.rate-limit.endpoints.login.refill-minutes=60",
    "app.rate-limit.endpoints.login.ttl-minutes=120",
    "app.rate-limit.endpoints.forgot-password.capacity=3",
    "app.rate-limit.endpoints.forgot-password.refill-tokens=3",
    "app.rate-limit.endpoints.forgot-password.refill-minutes=60",
    "app.rate-limit.endpoints.forgot-password.ttl-minutes=120"
})
@DisplayName("EndpointRateLimitFilter — proteção contra brute force e abuso")
class LoginRateLimitFilterTest {

    @Autowired
    MockMvc mockMvc;

    private static final String LOGIN_BODY = """
            {"email":"admin@ratelimit.com","password":"senhaErrada"}
            """;

    private static final String FORGOT_PASSWORD_BODY = """
            {"email":"admin@ratelimit.com"}
            """;

    // ---- /api/auth/login ----

    @Test
    @DisplayName("Requisições dentro do limite no /login devem receber resposta normal (401)")
    void login_withinLimit_shouldPassThrough() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "10.0.0.1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_BODY))
                    .andExpect(status().isUnauthorized()); // 401 = passou pelo rate limit
        }
    }

    @Test
    @DisplayName("Exceder o limite no /login deve retornar 429 com corpo RFC 9457")
    void login_exceedLimit_shouldReturn429() throws Exception {
        // IP 10.0.0.2 — esgota as 3 tentativas
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "10.0.0.2")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_BODY));
        }

        // 4ª tentativa deve ser bloqueada com 429
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "10.0.0.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.type").value("urn:problem:too-many-requests"))
                .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    @DisplayName("Rate limit do /login não deve afetar /register")
    void login_rateLimitDoesNotApplyToRegister() throws Exception {
        // IP 10.0.0.3 — esgota o bucket no /login
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "10.0.0.3")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_BODY));
        }

        // /api/auth/register não deve ser afetado pelo rate limit do /login
        mockMvc.perform(post("/api/auth/register")
                        .header("X-Forwarded-For", "10.0.0.3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(status)
                            .as("/register não deve retornar 429 — rate limit aplica-se só a endpoints configurados")
                            .isNotEqualTo(429);
                });
    }

    // ---- /api/auth/forgot-password ----

    @Test
    @DisplayName("Requisições dentro do limite no /forgot-password devem receber 202")
    void forgotPassword_withinLimit_shouldPassThrough() throws Exception {
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .header("X-Forwarded-For", "10.1.0.1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(FORGOT_PASSWORD_BODY))
                    .andExpect(status().isAccepted()); // 202 = passou pelo rate limit
        }
    }

    @Test
    @DisplayName("Exceder o limite no /forgot-password deve retornar 429 (proteção contra abuso)")
    void forgotPassword_exceedLimit_shouldReturn429() throws Exception {
        // IP 10.1.0.2 — esgota as 3 tentativas
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .header("X-Forwarded-For", "10.1.0.2")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(FORGOT_PASSWORD_BODY));
        }

        // 4ª tentativa deve ser bloqueada com 429
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("X-Forwarded-For", "10.1.0.2")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(FORGOT_PASSWORD_BODY))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.type").value("urn:problem:too-many-requests"))
                .andExpect(jsonPath("$.status").value(429));
    }

    @Test
    @DisplayName("Buckets de /login e /forgot-password são independentes por endpoint")
    void login_and_forgotPassword_bucketsAreIndependent() throws Exception {
        // IP 10.1.0.3 — esgota o bucket no /forgot-password
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/forgot-password")
                            .header("X-Forwarded-For", "10.1.0.3")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(FORGOT_PASSWORD_BODY));
        }

        // O mesmo IP ainda deve ter tokens disponíveis para /login (bucket independente)
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Forwarded-For", "10.1.0.3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(status)
                            .as("/login deve ter bucket independente do /forgot-password")
                            .isNotEqualTo(429);
                });
    }
}
