package com.ebbin.api.controller;

import com.ebbin.api.model.ExamEntry;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.ExamEntryRepository;
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

import java.time.LocalDate;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:examentrytest;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@examentrytest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("ExamEntryController — testes de integração")
class ExamEntryControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired ExamEntryRepository examEntryRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String userToken;
    private User regularUser;

    @BeforeEach
    void setUp() {
        regularUser = new User();
        regularUser.setEmail("user@examentrytest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        regularUser = userRepository.save(regularUser);
        userToken = jwtService.generateToken(regularUser.getEmail());
    }

    private ExamEntry persistEntry(User user, String name, LocalDate date, int score) {
        ExamEntry e = new ExamEntry();
        e.setUser(user);
        e.setExamDate(date);
        e.setExamName(name);
        e.setExamType("Simulado");
        e.setScorePercent(score);
        e.setNotes("notas");
        return examEntryRepository.save(e);
    }

    // ---- GET ----

    @Test
    @DisplayName("GET sem registros retorna lista vazia")
    void get_noRecord_returnsEmpty() throws Exception {
        mockMvc.perform(get("/api/exam-entries")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET retorna provas do usuário ordenadas por data desc")
    void get_returnsUserEntriesOrdered() throws Exception {
        persistEntry(regularUser, "Antiga", LocalDate.of(2024, 1, 10), 50);
        persistEntry(regularUser, "Recente", LocalDate.of(2025, 6, 1), 80);

        mockMvc.perform(get("/api/exam-entries")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].examName").value("Recente"))
                .andExpect(jsonPath("$[1].examName").value("Antiga"));
    }

    @Test
    @DisplayName("GET sem token retorna 401/403")
    void get_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/exam-entries"))
                .andExpect(status().is4xxClientError());
    }

    // ---- POST ----

    @Test
    @DisplayName("POST com payload válido retorna 201")
    void post_validPayload_returns201() throws Exception {
        String body = "{\"examDate\":\"2025-05-10\",\"examName\":\"ENEM\",\"examType\":\"Prova na íntegra\",\"scorePercent\":75,\"notes\":\"foco em geometria\"}";
        mockMvc.perform(post("/api/exam-entries")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").exists())
                .andExpect(jsonPath("$.examName").value("ENEM"))
                .andExpect(jsonPath("$.scorePercent").value(75));
    }

    @Test
    @DisplayName("POST com examName em branco retorna 400 ProblemDetail")
    void post_blankExamName_returns400() throws Exception {
        String body = "{\"examDate\":\"2025-05-10\",\"examName\":\"\",\"scorePercent\":50}";
        mockMvc.perform(post("/api/exam-entries")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("POST sem examDate retorna 400 ProblemDetail")
    void post_missingDate_returns400() throws Exception {
        String body = "{\"examName\":\"X\",\"scorePercent\":50}";
        mockMvc.perform(post("/api/exam-entries")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("POST com scorePercent > 100 retorna 400 ProblemDetail")
    void post_invalidScore_returns400() throws Exception {
        String body = "{\"examDate\":\"2025-05-10\",\"examName\":\"X\",\"scorePercent\":150}";
        mockMvc.perform(post("/api/exam-entries")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("POST sem token retorna 401/403")
    void post_unauthenticated_returns4xx() throws Exception {
        String body = "{\"examDate\":\"2025-05-10\",\"examName\":\"X\",\"scorePercent\":50}";
        mockMvc.perform(post("/api/exam-entries")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is4xxClientError());
    }

    // ---- PUT ----

    @Test
    @DisplayName("PUT com payload válido atualiza prova e retorna 200")
    void put_validPayload_returns200() throws Exception {
        ExamEntry existing = persistEntry(regularUser, "Original", LocalDate.of(2025, 3, 1), 60);

        String body = "{\"examDate\":\"2025-04-15\",\"examName\":\"Atualizada\",\"scorePercent\":90,\"notes\":\"melhorou\"}";
        mockMvc.perform(put("/api/exam-entries/" + existing.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(existing.getId()))
                .andExpect(jsonPath("$.examName").value("Atualizada"))
                .andExpect(jsonPath("$.scorePercent").value(90));
    }

    @Test
    @DisplayName("PUT com id inexistente retorna 404")
    void put_nonexistentId_returns404() throws Exception {
        String body = "{\"examDate\":\"2025-04-15\",\"examName\":\"X\",\"scorePercent\":50}";
        mockMvc.perform(put("/api/exam-entries/99999")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT em prova de outro usuário retorna 404")
    void put_entryFromAnotherUser_returns404() throws Exception {
        User other = new User();
        other.setEmail("other@examentrytest.com");
        other.setPassword(passwordEncoder.encode("senha456"));
        other.setRole(User.Role.USER);
        other = userRepository.save(other);

        ExamEntry otherEntry = persistEntry(other, "DoOutro", LocalDate.of(2025, 2, 1), 70);

        String body = "{\"examDate\":\"2025-04-15\",\"examName\":\"Hack\",\"scorePercent\":50}";
        mockMvc.perform(put("/api/exam-entries/" + otherEntry.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT com payload inválido retorna 400")
    void put_invalidPayload_returns400() throws Exception {
        ExamEntry existing = persistEntry(regularUser, "Original", LocalDate.of(2025, 3, 1), 60);

        String body = "{\"examDate\":\"2025-04-15\",\"examName\":\"\",\"scorePercent\":50}";
        mockMvc.perform(put("/api/exam-entries/" + existing.getId())
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT sem token retorna 401/403")
    void put_unauthenticated_returns4xx() throws Exception {
        String body = "{\"examDate\":\"2025-04-15\",\"examName\":\"X\",\"scorePercent\":50}";
        mockMvc.perform(put("/api/exam-entries/1")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().is4xxClientError());
    }

    // ---- DELETE ----

    @Test
    @DisplayName("DELETE existente retorna 204")
    void delete_existing_returns204() throws Exception {
        ExamEntry existing = persistEntry(regularUser, "Apagar", LocalDate.of(2025, 3, 1), 60);

        mockMvc.perform(delete("/api/exam-entries/" + existing.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/exam-entries")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("DELETE com id inexistente retorna 404")
    void delete_nonexistentId_returns404() throws Exception {
        mockMvc.perform(delete("/api/exam-entries/99999")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE em prova de outro usuário retorna 404")
    void delete_entryFromAnotherUser_returns404() throws Exception {
        User other = new User();
        other.setEmail("other2@examentrytest.com");
        other.setPassword(passwordEncoder.encode("senha456"));
        other.setRole(User.Role.USER);
        other = userRepository.save(other);

        ExamEntry otherEntry = persistEntry(other, "DoOutro", LocalDate.of(2025, 2, 1), 70);

        mockMvc.perform(delete("/api/exam-entries/" + otherEntry.getId())
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE sem token retorna 401/403")
    void delete_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(delete("/api/exam-entries/1"))
                .andExpect(status().is4xxClientError());
    }

    // ---- Isolamento ----

    @Test
    @DisplayName("Provas isoladas por usuário no GET")
    void entries_isolatedPerUser() throws Exception {
        User other = new User();
        other.setEmail("other3@examentrytest.com");
        other.setPassword(passwordEncoder.encode("senha456"));
        other.setRole(User.Role.USER);
        other = userRepository.save(other);
        String otherToken = jwtService.generateToken(other.getEmail());

        persistEntry(regularUser, "Minha", LocalDate.of(2025, 1, 1), 50);

        mockMvc.perform(get("/api/exam-entries")
                        .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }
}
