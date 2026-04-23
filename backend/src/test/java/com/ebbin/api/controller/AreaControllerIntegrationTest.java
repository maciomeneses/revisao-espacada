package com.ebbin.api.controller;

import com.ebbin.api.model.Area;
import com.ebbin.api.model.Discipline;
import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewStage;
import com.ebbin.api.model.Subject;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
import com.ebbin.api.repository.DisciplineRepository;
import com.ebbin.api.repository.SubjectRepository;
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

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:areatest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@areatest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("AreaController — testes de integração")
class AreaControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired AreaRepository areaRepository;
    @Autowired DisciplineRepository disciplineRepository;
    @Autowired SubjectRepository subjectRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private User user;
    private String token;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@areatest.com");
        user.setPassword(passwordEncoder.encode("senha123"));
        user.setRole(User.Role.USER);
        user = userRepository.save(user);
        token = jwtService.generateToken(user.getEmail());
    }

    @Test
    @DisplayName("GET /api/areas deve retornar lista vazia para usuário sem áreas")
    void list_empty() throws Exception {
        mockMvc.perform(get("/api/areas").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("POST /api/areas deve criar nova área (201)")
    void create_success() throws Exception {
        mockMvc.perform(post("/api/areas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Redação"}
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Redação"))
                .andExpect(jsonPath("$.id").isNumber());

        assertThat(areaRepository.findByUserAndName(user, "Redação")).isPresent();
    }

    @Test
    @DisplayName("POST /api/areas com nome duplicado deve retornar 409")
    void create_duplicate_returns409() throws Exception {
        Area existing = new Area();
        existing.setUser(user);
        existing.setName("Ciências da Natureza");
        areaRepository.save(existing);

        mockMvc.perform(post("/api/areas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Ciências da Natureza"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("POST /api/areas com nome em branco deve retornar 400")
    void create_blank_returns400() throws Exception {
        mockMvc.perform(post("/api/areas")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"   "}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("PUT /api/areas/{id} deve renomear e propagar para subjects.area")
    void rename_propagatesToSubjects() throws Exception {
        Area area = new Area();
        area.setUser(user);
        area.setName("Área Original");
        area = areaRepository.save(area);

        Subject s = new Subject();
        s.setUser(user);
        s.setClientId("subj-1");
        s.setArea("Área Original");
        s.setModulo("Mod");
        s.setAulaPrincipal("AP");
        s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA);
        s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(s);

        mockMvc.perform(put("/api/areas/" + area.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Área Renomeada"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Área Renomeada"));

        Subject refreshed = subjectRepository.findByUserAndClientId(user, "subj-1").orElseThrow();
        assertThat(refreshed.getArea()).isEqualTo("Área Renomeada");
    }

    @Test
    @DisplayName("PUT /api/areas/{id} com id inexistente deve retornar 404")
    void rename_notFound_returns404() throws Exception {
        mockMvc.perform(put("/api/areas/99999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"X"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/areas/{id} deve remover em cascata disciplines e subjects")
    void delete_cascades() throws Exception {
        Area area = new Area();
        area.setUser(user);
        area.setName("ParaDeletar");
        area = areaRepository.save(area);

        Discipline d = new Discipline();
        d.setUser(user);
        d.setArea(area);
        d.setName("Disc");
        d = disciplineRepository.save(d);

        Subject s = new Subject();
        s.setUser(user);
        s.setClientId("subj-cascade");
        s.setArea("ParaDeletar");
        s.setModulo("Disc");
        s.setAulaPrincipal("AP");
        s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA);
        s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        s.setDiscipline(d);
        subjectRepository.save(s);

        mockMvc.perform(delete("/api/areas/" + area.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(areaRepository.findByUserAndId(user, area.getId())).isEmpty();
        assertThat(disciplineRepository.findByUserAndId(user, d.getId())).isEmpty();
        assertThat(subjectRepository.findByUserAndClientId(user, "subj-cascade")).isEmpty();
    }

    @Test
    @DisplayName("GET /api/areas sem token deve retornar 4xx")
    void list_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/areas"))
                .andExpect(status().is4xxClientError());
    }
}
