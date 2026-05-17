package com.ebbin.api.controller;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.RoutineSlotRepository;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:routinetest;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@routinetest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("RoutineSlotController — testes de integração")
class RoutineSlotControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired RoutineSlotRepository routineRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String userToken;
    private User regularUser;

    @BeforeEach
    void setUp() {
        regularUser = new User();
        regularUser.setEmail("user@routinetest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        regularUser = userRepository.save(regularUser);
        userToken = jwtService.generateToken(regularUser.getEmail());
    }

    // ---- GET ----

    @Test
    @DisplayName("GET sem registros retorna lista vazia")
    void get_noRecord_returnsEmpty() throws Exception {
        mockMvc.perform(get("/api/routine")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET sem token retorna 401/403")
    void get_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/routine"))
                .andExpect(status().is4xxClientError());
    }

    // ---- PUT ----

    @Test
    @DisplayName("PUT com payload válido retorna 200 e a lista persistida")
    void put_validPayload_returns200() throws Exception {
        String body = "[{\"id\":\"c1\",\"dayOfWeek\":2,\"title\":\"Mat\",\"startTime\":\"08:00\",\"endTime\":\"09:00\",\"type\":\"study\",\"area\":\"Matemática\"}]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("c1"))
                .andExpect(jsonPath("$[0].dayOfWeek").value(2))
                .andExpect(jsonPath("$[0].type").value("study"))
                .andExpect(jsonPath("$[0].area").value("Matemática"));
    }

    @Test
    @DisplayName("PUT persiste e GET subsequente reflete")
    void put_thenGet_reflectsUpdate() throws Exception {
        String body = "[{\"id\":\"c1\",\"dayOfWeek\":1,\"title\":\"Mat\",\"type\":\"study\",\"area\":\"Matemática\"}]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/routine")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("c1"));
    }

    @Test
    @DisplayName("PUT com lista vazia limpa todos os slots")
    void put_emptyList_clears() throws Exception {
        String body = "[{\"id\":\"c1\",\"dayOfWeek\":1,\"title\":\"Mat\",\"type\":\"study\",\"area\":\"M\"}]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));

        mockMvc.perform(get("/api/routine")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("PUT idempotente — remove slots ausentes")
    void put_idempotent_removesMissing() throws Exception {
        String first = "[" +
                "{\"id\":\"c1\",\"dayOfWeek\":1,\"title\":\"A\",\"type\":\"study\",\"area\":\"M\"}," +
                "{\"id\":\"c2\",\"dayOfWeek\":2,\"title\":\"B\",\"type\":\"other\"}" +
                "]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(first))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));

        String second = "[{\"id\":\"c1\",\"dayOfWeek\":3,\"title\":\"A2\",\"type\":\"study\",\"area\":\"F\"}]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(second))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("c1"))
                .andExpect(jsonPath("$[0].dayOfWeek").value(3))
                .andExpect(jsonPath("$[0].area").value("F"));
    }

    @Test
    @DisplayName("PUT com dayOfWeek inválido retorna 400 ProblemDetail")
    void put_invalidDay_returns400() throws Exception {
        String body = "[{\"id\":\"c1\",\"dayOfWeek\":9,\"title\":\"T\",\"type\":\"study\",\"area\":\"M\"}]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT com type inválido retorna 400 ProblemDetail")
    void put_invalidType_returns400() throws Exception {
        String body = "[{\"id\":\"c1\",\"dayOfWeek\":1,\"title\":\"T\",\"type\":\"foo\",\"area\":\"M\"}]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT sem token retorna 401/403")
    void put_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(put("/api/routine")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("Rotinas isoladas por usuário")
    void routines_isolatedPerUser() throws Exception {
        User other = new User();
        other.setEmail("other@routinetest.com");
        other.setPassword(passwordEncoder.encode("senha456"));
        other.setRole(User.Role.USER);
        other = userRepository.save(other);
        String otherToken = jwtService.generateToken(other.getEmail());

        String body = "[{\"id\":\"c1\",\"dayOfWeek\":1,\"title\":\"A\",\"type\":\"study\",\"area\":\"M\"}]";
        mockMvc.perform(put("/api/routine")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/routine")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
