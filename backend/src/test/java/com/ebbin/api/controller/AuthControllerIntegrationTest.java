package com.ebbin.api.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

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
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@test.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("AuthController — testes de integração")
class AuthControllerIntegrationTest {

    @Autowired
    MockMvc mockMvc;

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
    @DisplayName("POST /api/auth/forgot-password com e-mail cadastrado deve retornar 202")
    void forgotPassword_existingEmail_returns202() throws Exception {
        mockMvc.perform(post("/api/auth/forgot-password")
                        .header("X-Forwarded-For", "192.168.2.1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@test.com"}
                                """))
                .andExpect(status().isAccepted());
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
}
