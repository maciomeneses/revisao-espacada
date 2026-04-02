package com.ebbin.api.controller;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.ReviewEventRepository;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes de integração para {@link ReviewEventController}.
 *
 * <p>Cobre todos os endpoints (GET e POST) com H2 em memória, exercitando
 * autenticação JWT, validação de payload e persistência de eventos.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:revieweventtest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@revieweventtest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("ReviewEventController — testes de integração")
class ReviewEventControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired ReviewEventRepository reviewEventRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String userToken;
    private User regularUser;

    private static final String TODAY = LocalDate.now().toString();

    private static final String VALID_EVENT_JSON = """
            {"subjectId":"subj-1","subjectName":"Aula de Biologia",
            "reviewDate":"%s","performance":"bom","reps":1,"questions":10}
            """.formatted(LocalDate.now());

    @BeforeEach
    void setUp() {
        regularUser = new User();
        regularUser.setEmail("user@revieweventtest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        regularUser = userRepository.save(regularUser);
        userToken = jwtService.generateToken(regularUser.getEmail());
    }

    // ---- GET /api/review-events ----

    @Test
    @DisplayName("GET /api/review-events deve retornar lista vazia para usuário sem eventos")
    void list_noEvents_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/review-events")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /api/review-events sem token deve retornar 401 ou 403")
    void list_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/review-events"))
                .andExpect(status().is4xxClientError());
    }

    // ---- POST /api/review-events ----

    @Test
    @DisplayName("POST /api/review-events com payload válido deve retornar 201 e o evento criado")
    void create_validPayload_returns201() throws Exception {
        mockMvc.perform(post("/api/review-events")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.subjectId").value("subj-1"))
                .andExpect(jsonPath("$.subjectName").value("Aula de Biologia"))
                .andExpect(jsonPath("$.performance").value("bom"))
                .andExpect(jsonPath("$.reps").value(1))
                .andExpect(jsonPath("$.questions").value(10));
    }

    @Test
    @DisplayName("POST /api/review-events deve persistir o evento no banco")
    void create_validPayload_persistsToDatabase() throws Exception {
        mockMvc.perform(post("/api/review-events")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isCreated());

        assertThat(reviewEventRepository.findAllByUserOrderByReviewDateDesc(regularUser))
                .hasSize(1)
                .first()
                .satisfies(e -> {
                    assertThat(e.getSubjectId()).isEqualTo("subj-1");
                    assertThat(e.getSubjectName()).isEqualTo("Aula de Biologia");
                });
    }

    @Test
    @DisplayName("GET /api/review-events deve retornar evento após POST")
    void list_afterPost_returnsCreatedEvent() throws Exception {
        mockMvc.perform(post("/api/review-events")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/review-events")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].subjectId").value("subj-1"));
    }

    @Test
    @DisplayName("POST /api/review-events com subjectId em branco deve retornar 400")
    void create_blankSubjectId_returns400() throws Exception {
        String invalid = """
                {"subjectId":"","subjectName":"Aula X",
                "reviewDate":"%s","performance":"bom","reps":1,"questions":10}
                """.formatted(TODAY);

        mockMvc.perform(post("/api/review-events")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalid))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/review-events com subjectName em branco deve retornar 400")
    void create_blankSubjectName_returns400() throws Exception {
        String invalid = """
                {"subjectId":"subj-1","subjectName":"",
                "reviewDate":"%s","performance":"bom","reps":1,"questions":10}
                """.formatted(TODAY);

        mockMvc.perform(post("/api/review-events")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalid))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/review-events com reviewDate nulo deve retornar 400")
    void create_nullReviewDate_returns400() throws Exception {
        String invalid = """
                {"subjectId":"subj-1","subjectName":"Aula X",
                "reviewDate":null,"performance":"bom","reps":1,"questions":10}
                """;

        mockMvc.perform(post("/api/review-events")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalid))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/review-events sem token deve retornar 401 ou 403")
    void create_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(post("/api/review-events")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("GET /api/review-events não retorna eventos de outro usuário")
    void list_isolatesPerUser() throws Exception {
        // Cria segundo usuário e registra evento para ele
        User otherUser = new User();
        otherUser.setEmail("other@revieweventtest.com");
        otherUser.setPassword(passwordEncoder.encode("senha456"));
        otherUser.setRole(User.Role.USER);
        otherUser = userRepository.save(otherUser);
        String otherToken = jwtService.generateToken(otherUser.getEmail());

        mockMvc.perform(post("/api/review-events")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(VALID_EVENT_JSON))
                .andExpect(status().isCreated());

        // regularUser não deve ver eventos do otherUser
        mockMvc.perform(get("/api/review-events")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
