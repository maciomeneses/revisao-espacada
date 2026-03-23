package com.ebbin.api.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.hamcrest.Matchers.*;

/**
 * Testes de integração para {@link MdcRequestFilter}.
 *
 * <p>Verifica que o filtro injeta o {@code requestId} no MDC e o propaga
 * como header {@code X-Request-ID} na resposta.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:mdctestdb",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@mdc.com",
    "app.admin.password=admin123"
})
@DisplayName("MdcRequestFilter — injeção de requestId no MDC")
class MdcRequestFilterTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    @DisplayName("Deve incluir X-Request-ID gerado automaticamente na resposta quando não informado")
    void shouldAddGeneratedRequestIdToResponse() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@mdc.com","password":"admin123"}
                                """))
                .andExpect(header().exists("X-Request-ID"))
                .andExpect(header().string("X-Request-ID", matchesPattern(
                        "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")));
    }

    @Test
    @DisplayName("Deve propagar o X-Request-ID do cliente quando fornecido e válido")
    void shouldEchoClientRequestIdWhenProvided() throws Exception {
        String clientRequestId = "client-req-abc-123";

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Request-ID", clientRequestId)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@mdc.com","password":"admin123"}
                                """))
                .andExpect(header().string("X-Request-ID", clientRequestId));
    }

    @Test
    @DisplayName("Deve gerar novo requestId quando o header fornecido excede 64 caracteres")
    void shouldGenerateNewIdWhenHeaderTooLong() throws Exception {
        String longId = "a".repeat(65);

        mockMvc.perform(post("/api/auth/login")
                        .header("X-Request-ID", longId)
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@mdc.com","password":"admin123"}
                                """))
                .andExpect(header().exists("X-Request-ID"))
                // O header recebido deve ser diferente do longId (foi gerado um novo UUID)
                .andExpect(header().string("X-Request-ID", not(longId)));
    }

    @Test
    @DisplayName("Deve gerar novo requestId quando o header X-Request-ID é apenas espaços em branco")
    void shouldGenerateNewIdWhenHeaderIsBlank() throws Exception {
        // "   " → isBlank() = true → !isBlank() = false → condição completa é false → UUID gerado
        mockMvc.perform(post("/api/auth/login")
                        .header("X-Request-ID", "   ")
                        .contentType(org.springframework.http.MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@mdc.com","password":"admin123"}
                                """))
                .andExpect(header().exists("X-Request-ID"))
                .andExpect(header().string("X-Request-ID", matchesPattern(
                        "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}")));
    }
}
