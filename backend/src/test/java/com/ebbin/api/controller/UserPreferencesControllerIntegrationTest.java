package com.ebbin.api.controller;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserPreferencesRepository;
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
    "spring.datasource.url=jdbc:h2:mem:userpreftest;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@userpreftest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("UserPreferencesController — testes de integração")
class UserPreferencesControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired UserPreferencesRepository preferencesRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String userToken;
    private User regularUser;

    @BeforeEach
    void setUp() {
        regularUser = new User();
        regularUser.setEmail("user@userpreftest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        regularUser = userRepository.save(regularUser);
        userToken = jwtService.generateToken(regularUser.getEmail());
    }

    // ---- GET /api/preferences ----

    @Test
    @DisplayName("GET sem registro prévio retorna defaults [0..6]")
    void get_noRecord_returnsDefaults() throws Exception {
        mockMvc.perform(get("/api/preferences")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowedReviewDays").isArray())
                .andExpect(jsonPath("$.allowedReviewDays.length()").value(7))
                .andExpect(jsonPath("$.allowedReviewDays[0]").value(0))
                .andExpect(jsonPath("$.allowedReviewDays[6]").value(6));
    }

    @Test
    @DisplayName("GET sem token retorna 401/403")
    void get_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/preferences"))
                .andExpect(status().is4xxClientError());
    }

    // ---- PUT /api/preferences ----

    @Test
    @DisplayName("PUT com payload válido retorna 200 e dias atualizados")
    void put_validPayload_returns200() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1,3,5]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowedReviewDays.length()").value(3))
                .andExpect(jsonPath("$.allowedReviewDays[0]").value(1))
                .andExpect(jsonPath("$.allowedReviewDays[1]").value(3))
                .andExpect(jsonPath("$.allowedReviewDays[2]").value(5));
    }

    @Test
    @DisplayName("PUT persiste alteração — GET subsequente reflete novos dias")
    void put_thenGet_reflectsUpdate() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[2,4]}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/preferences")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowedReviewDays.length()").value(2))
                .andExpect(jsonPath("$.allowedReviewDays[0]").value(2))
                .andExpect(jsonPath("$.allowedReviewDays[1]").value(4));
    }

    @Test
    @DisplayName("PUT com lista vazia retorna 400 ProblemDetail")
    void put_emptyList_returns400() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT com dia=7 retorna 400 ProblemDetail")
    void put_daySeven_returns400() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[0,7]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT com dia=-1 retorna 400 ProblemDetail")
    void put_dayNegative_returns400() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[-1,3]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT com allowedReviewDays nulo retorna 400")
    void put_nullField_returns400() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":null}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT sem token retorna 401/403")
    void put_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1,2,3]}"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("PUT com elemento null no array retorna 400")
    void put_nullElement_returns400() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1,null,3]}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT com body vazio retorna 400 (dto.allowedReviewDays() == null)")
    void put_emptyBody_returns400() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    // ---- maxReviewsPerDay ----

    @Test
    @DisplayName("GET sem registro prévio retorna maxReviewsPerDay null (sem limite)")
    void get_noRecord_maxPerDayNull() throws Exception {
        mockMvc.perform(get("/api/preferences")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxReviewsPerDay").doesNotExist());
    }

    @Test
    @DisplayName("PUT com maxReviewsPerDay persiste e GET reflete o limite")
    void put_maxPerDay_thenGet_reflects() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1,3,5],\"maxReviewsPerDay\":4}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxReviewsPerDay").value(4));

        mockMvc.perform(get("/api/preferences")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxReviewsPerDay").value(4));
    }

    @Test
    @DisplayName("PUT sem maxReviewsPerDay limpa limite previamente definido")
    void put_withoutMaxPerDay_clearsLimit() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1,3,5],\"maxReviewsPerDay\":4}"))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1,3,5]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.maxReviewsPerDay").doesNotExist());
    }

    @Test
    @DisplayName("PUT com maxReviewsPerDay=0 retorna 400 ProblemDetail")
    void put_maxPerDayZero_returns400() throws Exception {
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1],\"maxReviewsPerDay\":0}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("Usuários distintos têm preferências isoladas")
    void preferences_isolatedPerUser() throws Exception {
        User otherUser = new User();
        otherUser.setEmail("other@userpreftest.com");
        otherUser.setPassword(passwordEncoder.encode("senha456"));
        otherUser.setRole(User.Role.USER);
        otherUser = userRepository.save(otherUser);
        String otherToken = jwtService.generateToken(otherUser.getEmail());

        // regularUser atualiza para [1,3,5]
        mockMvc.perform(put("/api/preferences")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"allowedReviewDays\":[1,3,5]}"))
                .andExpect(status().isOk());

        // otherUser ainda vê defaults
        mockMvc.perform(get("/api/preferences")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.allowedReviewDays.length()").value(7));
    }
}
