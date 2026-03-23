package com.ebbin.api.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes de integração para os endpoints do Spring Boot Actuator.
 *
 * <p>Verifica que {@code /actuator/health} é público (liveness probe), que o
 * status retornado é UP (com H2 em memória como DataSource), e que endpoints
 * não expostos retornam 404 (princípio do menor privilégio: só "health" exposto).
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:actuatortest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@actuatortest.com",
    "app.admin.password=admin123"
})
@DisplayName("Actuator — health endpoint e segurança")
class ActuatorIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /actuator/health deve retornar 200 sem autenticação (endpoint público)")
    void actuatorHealth_isPublic_returns200() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    @DisplayName("GET /actuator/health deve incluir campo 'status' no response body")
    void actuatorHealth_containsStatusField() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").exists());
    }

    @Test
    @DisplayName("GET /actuator/info sem autenticação deve retornar 401 (protegido por security)")
    void actuatorInfo_unauthenticated_returns401() throws Exception {
        // /actuator/** (exceto /health) requer autenticação — sem token recebe 401.
        // O endpoint também não está exposto (seria 404 se autenticado), mas a
        // camada de segurança atua primeiro, retornando 401 para requests não autenticados.
        mockMvc.perform(get("/actuator/info"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /actuator/metrics sem autenticação deve retornar 401 (protegido por security)")
    void actuatorMetrics_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/actuator/metrics"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /actuator/env sem autenticação deve retornar 401 (protege variáveis de ambiente)")
    void actuatorEnv_unauthenticated_returns401() throws Exception {
        mockMvc.perform(get("/actuator/env"))
                .andExpect(status().isUnauthorized());
    }
}
