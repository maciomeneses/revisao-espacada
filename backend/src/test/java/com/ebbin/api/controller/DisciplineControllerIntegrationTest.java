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
    "spring.datasource.url=jdbc:h2:mem:disciplinetest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@disciplinetest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("DisciplineController — testes de integração")
class DisciplineControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired AreaRepository areaRepository;
    @Autowired DisciplineRepository disciplineRepository;
    @Autowired SubjectRepository subjectRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private User user;
    private Area area;
    private String token;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@disciplinetest.com");
        user.setPassword(passwordEncoder.encode("senha123"));
        user.setRole(User.Role.USER);
        user = userRepository.save(user);
        token = jwtService.generateToken(user.getEmail());

        area = new Area();
        area.setUser(user);
        area.setName("Ciências da Natureza");
        area = areaRepository.save(area);
    }

    @Test
    @DisplayName("GET /api/disciplines deve retornar lista vazia quando nenhuma cadastrada")
    void list_empty() throws Exception {
        mockMvc.perform(get("/api/disciplines").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /api/disciplines?areaId= deve filtrar por área")
    void list_byArea() throws Exception {
        Discipline d = new Discipline();
        d.setUser(user);
        d.setArea(area);
        d.setName("Biologia");
        disciplineRepository.save(d);

        Area outra = new Area();
        outra.setUser(user);
        outra.setName("Outra");
        outra = areaRepository.save(outra);
        Discipline ignorada = new Discipline();
        ignorada.setUser(user);
        ignorada.setArea(outra);
        ignorada.setName("Ignorada");
        disciplineRepository.save(ignorada);

        mockMvc.perform(get("/api/disciplines?areaId=" + area.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Biologia"));
    }

    @Test
    @DisplayName("POST /api/disciplines deve criar nova disciplina (201)")
    void create_success() throws Exception {
        mockMvc.perform(post("/api/disciplines")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"areaId":%d,"name":"Biologia"}
                                """.formatted(area.getId())))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Biologia"))
                .andExpect(jsonPath("$.areaId").value(area.getId()))
                .andExpect(jsonPath("$.areaName").value("Ciências da Natureza"));
    }

    @Test
    @DisplayName("POST /api/disciplines com areaId inexistente deve retornar 404")
    void create_unknownArea_returns404() throws Exception {
        mockMvc.perform(post("/api/disciplines")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"areaId":99999,"name":"Biologia"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("POST /api/disciplines com nome duplicado na mesma área deve retornar 409")
    void create_duplicate_returns409() throws Exception {
        Discipline d = new Discipline();
        d.setUser(user);
        d.setArea(area);
        d.setName("Biologia");
        disciplineRepository.save(d);

        mockMvc.perform(post("/api/disciplines")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"areaId":%d,"name":"Biologia"}
                                """.formatted(area.getId())))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").exists());
    }

    @Test
    @DisplayName("PUT /api/disciplines/{id} deve renomear e propagar para subjects.modulo")
    void rename_propagatesToSubjects() throws Exception {
        Discipline d = new Discipline();
        d.setUser(user);
        d.setArea(area);
        d.setName("Biologia");
        d = disciplineRepository.save(d);

        Subject s = new Subject();
        s.setUser(user);
        s.setClientId("subj-bio");
        s.setArea("Ciências da Natureza");
        s.setModulo("Biologia");
        s.setAulaPrincipal("AP");
        s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA);
        s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        s.setDiscipline(d);
        subjectRepository.save(s);

        mockMvc.perform(put("/api/disciplines/" + d.getId())
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"name":"Bio"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Bio"));

        Subject refreshed = subjectRepository.findByUserAndClientId(user, "subj-bio").orElseThrow();
        assertThat(refreshed.getModulo()).isEqualTo("Bio");
    }

    @Test
    @DisplayName("DELETE /api/disciplines/{id} deve remover em cascata os subjects")
    void delete_cascades() throws Exception {
        Discipline d = new Discipline();
        d.setUser(user);
        d.setArea(area);
        d.setName("ParaDeletar");
        d = disciplineRepository.save(d);

        Subject s = new Subject();
        s.setUser(user);
        s.setClientId("subj-to-cascade");
        s.setArea("Ciências da Natureza");
        s.setModulo("ParaDeletar");
        s.setAulaPrincipal("AP");
        s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA);
        s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        s.setDiscipline(d);
        subjectRepository.save(s);

        mockMvc.perform(delete("/api/disciplines/" + d.getId())
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());

        assertThat(disciplineRepository.findByUserAndId(user, d.getId())).isEmpty();
        assertThat(subjectRepository.findByUserAndClientId(user, "subj-to-cascade")).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/disciplines/{id} inexistente deve retornar 404")
    void delete_notFound_returns404() throws Exception {
        mockMvc.perform(delete("/api/disciplines/99999")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/disciplines sem token deve retornar 4xx")
    void list_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/disciplines"))
                .andExpect(status().is4xxClientError());
    }
}
