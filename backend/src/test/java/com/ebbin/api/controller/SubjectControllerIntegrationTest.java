package com.ebbin.api.controller;

import com.ebbin.api.model.Subject;
import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewStage;
import com.ebbin.api.model.User;
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

/**
 * Testes de integração para {@link SubjectController}.
 *
 * <p>Cobre todos os endpoints CRUD do controller com H2 em memória,
 * exercitando cenários de autenticação, validação e lógica de sincronização.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:subjecttest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@subjecttest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("SubjectController — testes de integração")
class SubjectControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired SubjectRepository subjectRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String userToken;
    private User regularUser;

    /** JSON válido de um único subject para uso nos testes */
    private static final String SUBJECT_JSON = """
            {"id":"subj-1","modulo":"Módulo A","area":"Área X","aulaPrincipal":"Aula 1",
            "relevancia":"Alta","aulaAssistida":false,"preAulaFeita":false,
            "flashcardsFeitos":false,"fixacao24hFeita":false,"estudoReversoFeito":false,
            "rev7dFeita":false,"rev30dFeita":false,"rev60dFeita":false,"rev90dFeita":false,
            "currentStage":"aula","nextReviewDate":null,"lastReviewDate":null,
            "lastPerformance":null,"performanceLevel":"nao_classificada"}
            """;

    @BeforeEach
    void setUp() {
        regularUser = new User();
        regularUser.setEmail("user@subjecttest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        regularUser = userRepository.save(regularUser);
        userToken = jwtService.generateToken(regularUser.getEmail());
    }

    // ---- GET /api/subjects ----

    @Test
    @DisplayName("GET /api/subjects deve retornar lista vazia para usuário sem subjects")
    void list_authenticatedUser_returnsEmptyList() throws Exception {
        mockMvc.perform(get("/api/subjects")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("GET /api/subjects deve retornar subjects existentes do usuário")
    void list_userWithSubjects_returnsSubjectList() throws Exception {
        // Persiste um subject diretamente no banco
        Subject s = new Subject();
        s.setUser(regularUser);
        s.setClientId("subj-exist-1");
        s.setModulo("Módulo B");
        s.setArea("Área Y");
        s.setAulaPrincipal("Aula 2");
        s.setRelevancia("Média");
        s.setCurrentStage(ReviewStage.AULA);
        s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(s);

        mockMvc.perform(get("/api/subjects")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("subj-exist-1"));
    }

    @Test
    @DisplayName("GET /api/subjects sem token deve retornar 401 ou 403")
    void list_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(get("/api/subjects"))
                .andExpect(status().is4xxClientError());
    }

    // ---- POST /api/subjects/sync ----

    @Test
    @DisplayName("POST /api/subjects/sync deve criar subjects novos")
    void sync_newSubjects_createsAndReturns200() throws Exception {
        String body = "[" + SUBJECT_JSON + "]";

        mockMvc.perform(post("/api/subjects/sync")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("subj-1"))
                .andExpect(jsonPath("$[0].modulo").value("Módulo A"));
    }

    @Test
    @DisplayName("POST /api/subjects/sync?destructive=true deve remover subjects ausentes na lista enviada")
    void sync_destructive_removesAbsentSubjects() throws Exception {
        // Persiste subject que não estará na lista de sync
        Subject toDelete = new Subject();
        toDelete.setUser(regularUser);
        toDelete.setClientId("will-be-deleted");
        toDelete.setModulo("M"); toDelete.setArea("A");
        toDelete.setAulaPrincipal("AP"); toDelete.setRelevancia("Baixa");
        toDelete.setCurrentStage(ReviewStage.AULA);
        toDelete.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(toDelete);

        // Sync envia apenas "subj-1" com destructive=true, portanto "will-be-deleted" deve ser removido
        String body = "[" + SUBJECT_JSON + "]";

        mockMvc.perform(post("/api/subjects/sync?destructive=true")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value("subj-1"));

        // Verifica remoção no banco
        assertThat(subjectRepository.findAll()).noneMatch(
                sub -> "will-be-deleted".equals(sub.getClientId()));
    }

    @Test
    @DisplayName("POST /api/subjects/sync (padrão, não-destrutivo) deve preservar subjects ausentes")
    void sync_nonDestructive_keepsAbsentSubjects() throws Exception {
        // Persiste subject que NÃO está na lista — com padrão não-destrutivo, deve sobreviver
        Subject survivor = new Subject();
        survivor.setUser(regularUser);
        survivor.setClientId("should-survive");
        survivor.setModulo("M"); survivor.setArea("A");
        survivor.setAulaPrincipal("AP"); survivor.setRelevancia("Baixa");
        survivor.setCurrentStage(ReviewStage.AULA);
        survivor.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(survivor);

        // Sync sem ?destructive — "should-survive" NÃO deve ser removido
        String body = "[" + SUBJECT_JSON + "]";

        mockMvc.perform(post("/api/subjects/sync")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        assertThat(subjectRepository.findAll()).anyMatch(
                sub -> "should-survive".equals(sub.getClientId()));
    }

    @Test
    @DisplayName("POST /api/subjects/sync?destructive=true com lista vazia deve remover todos os subjects")
    void sync_destructive_emptyList_removesAllSubjects() throws Exception {
        // Persiste subject existente
        Subject s = new Subject();
        s.setUser(regularUser);
        s.setClientId("subj-to-clear");
        s.setModulo("M"); s.setArea("A"); s.setAulaPrincipal("AP"); s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA); s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(s);

        mockMvc.perform(post("/api/subjects/sync?destructive=true")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[]"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    @DisplayName("POST /api/subjects/sync sem token deve retornar 401 ou 403")
    void sync_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(post("/api/subjects/sync")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("[" + SUBJECT_JSON + "]"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("POST /api/subjects/sync com subject inválido (campo obrigatório vazio) deve retornar 400")
    void sync_invalidSubject_returns400() throws Exception {
        // id em branco viola @NotBlank
        String invalidBody = """
                [{"id":"","modulo":"M","area":"A","aulaPrincipal":"AP","relevancia":"Alta",
                "aulaAssistida":false,"preAulaFeita":false,"flashcardsFeitos":false,
                "fixacao24hFeita":false,"estudoReversoFeito":false,"rev7dFeita":false,
                "rev30dFeita":false,"rev60dFeita":false,"rev90dFeita":false,
                "currentStage":"aula","performanceLevel":"nao_classificada"}]
                """;
        mockMvc.perform(post("/api/subjects/sync")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidBody))
                .andExpect(status().isBadRequest());
    }

    // ---- PUT /api/subjects/{id} ----

    @Test
    @DisplayName("PUT /api/subjects/{id} deve criar subject quando não existe (upsert)")
    void upsert_newSubject_createsAndReturns200() throws Exception {
        mockMvc.perform(put("/api/subjects/subj-1")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SUBJECT_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("subj-1"))
                .andExpect(jsonPath("$.modulo").value("Módulo A"));
    }

    @Test
    @DisplayName("PUT /api/subjects/{id} com id do path divergente do id do corpo deve retornar 400")
    void upsert_pathIdMismatch_returns400() throws Exception {
        // Path "subj-outro" != body "subj-1" — a validação de consistência rejeita antes do upsert
        mockMvc.perform(put("/api/subjects/subj-outro")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(SUBJECT_JSON))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.detail").value(
                        "O id do path (subj-outro) não corresponde ao id do corpo (subj-1)"));

        // Nada foi persistido
        assertThat(subjectRepository.findByUserAndClientId(regularUser, "subj-1")).isEmpty();
    }

    @Test
    @DisplayName("PUT /api/subjects/{id} sem os flags legados de estágio deve criar subject com flags false")
    void upsert_payloadWithoutLegacyStageFlags_createsWithFalseFlags() throws Exception {
        // Payload idêntico ao enviado pelo addSubject do frontend ao registrar um
        // estudo novo: omite fixacao24hFeita, estudoReversoFeito e rev*Feita.
        // Regressão: com os flags como boolean primitivo no record, o Jackson 3
        // rejeitava o campo ausente (FAIL_ON_NULL_FOR_PRIMITIVES) e o registro
        // falhava com 500.
        String frontendJson = """
                {"id":"subj-front","modulo":"Física","area":"Ciências da Natureza",
                "aulaPrincipal":"movimento uniforme","relevancia":"Alta",
                "aulaAssistida":false,"preAulaFeita":false,"flashcardsFeitos":false,
                "currentStage":"aula","nextReviewDate":null,"lastReviewDate":null,
                "lastPerformance":null,"performanceLevel":"nao_classificada"}
                """;

        mockMvc.perform(put("/api/subjects/subj-front")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(frontendJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("subj-front"))
                .andExpect(jsonPath("$.area").value("Ciências da Natureza"))
                .andExpect(jsonPath("$.fixacao24hFeita").value(false))
                .andExpect(jsonPath("$.rev90dFeita").value(false));

        assertThat(subjectRepository.findByUserAndClientId(regularUser, "subj-front"))
                .hasValueSatisfying(saved -> {
                    assertThat(saved.isFixacao24hFeita()).isFalse();
                    assertThat(saved.isEstudoReversoFeito()).isFalse();
                    assertThat(saved.isRev7dFeita()).isFalse();
                });
    }

    @Test
    @DisplayName("PUT /api/subjects/{id} deve atualizar subject existente")
    void upsert_existingSubject_updatesAndReturns200() throws Exception {
        // Persiste subject existente
        Subject s = new Subject();
        s.setUser(regularUser);
        s.setClientId("subj-1");
        s.setModulo("Módulo Original"); s.setArea("Área X");
        s.setAulaPrincipal("Aula 1"); s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA); s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(s);

        // Atualiza para aulaAssistida = true e stage = Learning
        String updatedJson = """
                {"id":"subj-1","modulo":"Módulo A","area":"Área X","aulaPrincipal":"Aula 1",
                "relevancia":"Alta","aulaAssistida":true,"preAulaFeita":false,
                "flashcardsFeitos":false,"fixacao24hFeita":false,"estudoReversoFeito":false,
                "rev7dFeita":false,"rev30dFeita":false,"rev60dFeita":false,"rev90dFeita":false,
                "currentStage":"Learning","nextReviewDate":null,"lastReviewDate":null,
                "lastPerformance":null,"performanceLevel":"nao_classificada"}
                """;

        mockMvc.perform(put("/api/subjects/subj-1")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(updatedJson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.aulaAssistida").value(true))
                .andExpect(jsonPath("$.currentStage").value("Learning"));
    }

    @Test
    @DisplayName("PUT /api/subjects/{id} com campo obrigatório vazio deve retornar 400")
    void upsert_invalidSubject_returns400() throws Exception {
        String invalidJson = """
                {"id":"subj-1","modulo":"","area":"Área X","aulaPrincipal":"Aula 1",
                "relevancia":"Alta","aulaAssistida":false,"preAulaFeita":false,
                "flashcardsFeitos":false,"fixacao24hFeita":false,"estudoReversoFeito":false,
                "rev7dFeita":false,"rev30dFeita":false,"rev60dFeita":false,"rev90dFeita":false,
                "currentStage":"aula","performanceLevel":"nao_classificada"}
                """;
        mockMvc.perform(put("/api/subjects/subj-1")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(invalidJson))
                .andExpect(status().isBadRequest());
    }

    // ---- DELETE /api/subjects/{id} ----

    @Test
    @DisplayName("DELETE /api/subjects/{id} deve remover subject existente e retornar 204")
    void delete_existingSubject_returns204() throws Exception {
        // Persiste subject para deletar
        Subject s = new Subject();
        s.setUser(regularUser);
        s.setClientId("subj-del");
        s.setModulo("M"); s.setArea("A"); s.setAulaPrincipal("AP"); s.setRelevancia("Alta");
        s.setCurrentStage(ReviewStage.AULA); s.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);
        subjectRepository.save(s);

        mockMvc.perform(delete("/api/subjects/subj-del")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());

        assertThat(subjectRepository.findByUserAndClientId(regularUser, "subj-del")).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/subjects/{id} de subject inexistente deve retornar 204 (idempotente)")
    void delete_nonExistentSubject_returns204() throws Exception {
        // deleteByUserAndClientId não lança exceção quando não encontra — é idempotente
        mockMvc.perform(delete("/api/subjects/subj-nao-existe")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("DELETE /api/subjects/{id} sem token deve retornar 401 ou 403")
    void delete_unauthenticated_returns4xx() throws Exception {
        mockMvc.perform(delete("/api/subjects/subj-1"))
                .andExpect(status().is4xxClientError());
    }

    // ---- Limite de tamanho do body no sync ----

    @Test
    @DisplayName("POST /api/subjects/sync com lista acima de 500 itens deve retornar 400")
    void sync_exceedsMaxSize_returns400() throws Exception {
        // Gera uma lista com 501 subjects válidos (máx. permitido é 500)
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < 501; i++) {
            if (i > 0) sb.append(",");
            sb.append("""
                    {"id":"subj-%d","modulo":"M","area":"A","aulaPrincipal":"AP","relevancia":"Alta",
                    "aulaAssistida":false,"preAulaFeita":false,"flashcardsFeitos":false,
                    "fixacao24hFeita":false,"estudoReversoFeito":false,"rev7dFeita":false,
                    "rev30dFeita":false,"rev60dFeita":false,"rev90dFeita":false,
                    "currentStage":"aula","nextReviewDate":null,"lastReviewDate":null,
                    "lastPerformance":null,"performanceLevel":"nao_classificada"}
                    """.formatted(i));
        }
        sb.append("]");

        mockMvc.perform(post("/api/subjects/sync")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sb.toString()))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/subjects/sync com exatamente 500 itens deve ser aceito (limite exato)")
    void sync_exactlyMaxSize_returns200() throws Exception {
        // Gera uma lista com exatamente 500 subjects (limite máximo permitido)
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < 500; i++) {
            if (i > 0) sb.append(",");
            sb.append("""
                    {"id":"subj-%d","modulo":"M","area":"A","aulaPrincipal":"AP","relevancia":"Alta",
                    "aulaAssistida":false,"preAulaFeita":false,"flashcardsFeitos":false,
                    "fixacao24hFeita":false,"estudoReversoFeito":false,"rev7dFeita":false,
                    "rev30dFeita":false,"rev60dFeita":false,"rev90dFeita":false,
                    "currentStage":"aula","nextReviewDate":null,"lastReviewDate":null,
                    "lastPerformance":null,"performanceLevel":"nao_classificada"}
                    """.formatted(i));
        }
        sb.append("]");

        mockMvc.perform(post("/api/subjects/sync")
                        .header("Authorization", "Bearer " + userToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sb.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(500));
    }
}
