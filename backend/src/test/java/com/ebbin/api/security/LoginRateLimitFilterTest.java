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
 * Testes de integração para o {@link LoginRateLimitFilter}.
 *
 * <p>Cada teste usa um IP diferente via X-Forwarded-For para garantir isolamento —
 * o bucket é por IP, então IPs distintos partem sempre com o token cheio.</p>
 *
 * Capacidade configurada = 3 requisições/60 min por IP.
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
    "app.rate-limit.login.capacity=3",
    "app.rate-limit.login.refill-tokens=3",
    "app.rate-limit.login.refill-minutes=60"
})
@DisplayName("LoginRateLimitFilter — proteção contra brute force")
class LoginRateLimitFilterTest {

    @Autowired
    MockMvc mockMvc;

    private static final String LOGIN_BODY = """
            {"email":"admin@ratelimit.com","password":"senhaErrada"}
            """;

    @Test
    @DisplayName("Requisições dentro do limite devem receber resposta normal (401 para credenciais inválidas)")
    void withinLimit_shouldPassThrough() throws Exception {
        // IP 10.0.0.1 — bucket novo com capacity=3
        for (int i = 0; i < 3; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "10.0.0.1")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_BODY))
                    .andExpect(status().isUnauthorized()); // 401 = passou pelo rate limit, atingiu o controller
        }
    }

    @Test
    @DisplayName("Exceder o limite deve retornar 429 com mensagem de erro RFC 9457")
    void exceedLimit_shouldReturn429() throws Exception {
        // IP 10.0.0.2 — bucket novo com capacity=3
        // Esgota as 3 tentativas
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
    @DisplayName("Rate limit deve se aplicar apenas ao endpoint de login (não ao /register)")
    void rateLimitOnlyOnLoginPath() throws Exception {
        // IP 10.0.0.3 — esgota o bucket no /login
        for (int i = 0; i < 4; i++) {
            mockMvc.perform(post("/api/auth/login")
                            .header("X-Forwarded-For", "10.0.0.3")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(LOGIN_BODY));
        }

        // /api/auth/register usa servlet path diferente — rate limit não deve ser aplicado
        mockMvc.perform(post("/api/auth/register")
                        .header("X-Forwarded-For", "10.0.0.3")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(LOGIN_BODY))
                .andExpect(result -> {
                    int status = result.getResponse().getStatus();
                    org.assertj.core.api.Assertions.assertThat(status)
                            .as("/register não deve retornar 429 — rate limit aplica-se só ao /login")
                            .isNotEqualTo(429);
                });
    }
}
