package com.ebbin.api.controller;

import com.ebbin.api.model.SubjectTemplate;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.SubjectTemplateRepository;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.JwtService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.test.autoconfigure.AutoConfigureTestDatabase;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:subjecttemplatetest;MODE=PostgreSQL",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@subjecttemplatetest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("SubjectTemplateController — testes de integração")
class SubjectTemplateControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired SubjectTemplateRepository templateRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String userToken;

    @BeforeEach
    void setUp() {
        User regularUser = new User();
        regularUser.setEmail("user@subjecttemplatetest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        regularUser = userRepository.save(regularUser);
        userToken = jwtService.generateToken(regularUser.getEmail());
    }

    private SubjectTemplate persistTemplate(String area, String disciplina, String assunto, String relevancia) {
        SubjectTemplate t = new SubjectTemplate();
        t.setArea(area);
        t.setDisciplina(disciplina);
        t.setAssunto(assunto);
        t.setRelevancia(relevancia);
        return templateRepository.save(t);
    }

    @Test
    @DisplayName("GET sem registros retorna lista vazia")
    void get_noRecord_returnsEmpty() throws Exception {
        mockMvc.perform(get("/api/subject-templates")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET retorna todos os templates ordenados por assunto")
    void get_returnsAllOrdered() throws Exception {
        persistTemplate("Natureza", "Física", "Cinemática", "Alta");
        persistTemplate("Natureza", "Física", "Ondas", "Média");
        persistTemplate("Humanas", "História", "Brasil Colônia", "Alta");

        mockMvc.perform(get("/api/subject-templates")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(3))
                .andExpect(jsonPath("$[0].assunto").value("Brasil Colônia"))
                .andExpect(jsonPath("$[1].assunto").value("Cinemática"))
                .andExpect(jsonPath("$[2].assunto").value("Ondas"));
    }

    @Test
    @DisplayName("GET com disciplina filtra resultados case-insensitive")
    void get_byDisciplina_returnsFiltered() throws Exception {
        persistTemplate("Natureza", "Física", "Cinemática", "Alta");
        persistTemplate("Natureza", "Física", "Ondas", "Média");
        persistTemplate("Humanas", "História", "Brasil Colônia", "Alta");

        mockMvc.perform(get("/api/subject-templates")
                        .param("disciplina", "fÍsiCa")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].disciplina").value("Física"))
                .andExpect(jsonPath("$[0].assunto").value("Cinemática"))
                .andExpect(jsonPath("$[1].assunto").value("Ondas"));
    }

    @Test
    @DisplayName("GET com disciplina em branco trata como sem filtro")
    void get_blankDisciplina_returnsAll() throws Exception {
        persistTemplate("Natureza", "Física", "Cinemática", "Alta");
        persistTemplate("Humanas", "História", "Brasil Colônia", "Alta");

        mockMvc.perform(get("/api/subject-templates")
                        .param("disciplina", "   ")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    @DisplayName("GET com disciplina inexistente retorna lista vazia")
    void get_unknownDisciplina_returnsEmpty() throws Exception {
        persistTemplate("Natureza", "Física", "Cinemática", "Alta");

        mockMvc.perform(get("/api/subject-templates")
                        .param("disciplina", "Inexistente")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET expõe todos os campos do DTO")
    void get_exposesAllFields() throws Exception {
        SubjectTemplate t = persistTemplate("Natureza", "Física", "Cinemática", "Alta");

        mockMvc.perform(get("/api/subject-templates")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(t.getId()))
                .andExpect(jsonPath("$[0].area").value("Natureza"))
                .andExpect(jsonPath("$[0].disciplina").value("Física"))
                .andExpect(jsonPath("$[0].assunto").value("Cinemática"))
                .andExpect(jsonPath("$[0].relevancia").value("Alta"));
    }

    @Test
    @DisplayName("GET sem token retorna 401/403")
    void get_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/subject-templates"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("GET com disciplina sem token retorna 401/403")
    void getWithFilter_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/subject-templates").param("disciplina", "Física"))
                .andExpect(status().is4xxClientError());
    }
}
