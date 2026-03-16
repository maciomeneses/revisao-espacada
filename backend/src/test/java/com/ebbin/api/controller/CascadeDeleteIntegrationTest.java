package com.ebbin.api.controller;

import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewStage;
import com.ebbin.api.model.Subject;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.SubjectRepository;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.JwtService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Testes de cascade delete sem @Transactional para garantir que o ON DELETE CASCADE
 * é testado com commits reais no banco (H2 em memória).
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:cascadetest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@cascade.com",
    "app.admin.password=admin123"
})
@DisplayName("Cascade Delete — ON DELETE CASCADE via banco de dados")
class CascadeDeleteIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired SubjectRepository subjectRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String adminToken;
    private UUID cascadeUserId;

    @BeforeEach
    void setUp() {
        User admin = userRepository.findByEmail("admin@cascade.com")
                .orElseThrow(() -> new IllegalStateException("Admin não criado"));
        adminToken = jwtService.generateToken(admin.getEmail());

        User cascadeUser = new User();
        cascadeUser.setEmail("cascade@cascade.com");
        cascadeUser.setPassword(passwordEncoder.encode("senha123"));
        cascadeUser.setRole(User.Role.USER);
        cascadeUser = userRepository.save(cascadeUser);
        cascadeUserId = cascadeUser.getId();

        Subject s1 = new Subject();
        s1.setClientId("cascade-client-1");
        s1.setUser(cascadeUser);
        s1.setModulo("M1"); s1.setArea("A1"); s1.setAulaPrincipal("AP1");
        s1.setRelevancia("Alta"); s1.setCurrentStage(ReviewStage.AULA);
        s1.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);

        Subject s2 = new Subject();
        s2.setClientId("cascade-client-2");
        s2.setUser(cascadeUser);
        s2.setModulo("M2"); s2.setArea("A2"); s2.setAulaPrincipal("AP2");
        s2.setRelevancia("Média"); s2.setCurrentStage(ReviewStage.AULA);
        s2.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);

        subjectRepository.saveAll(List.of(s1, s2));
    }

    @AfterEach
    void tearDown() {
        // Clean up any remaining subjects and users from this test
        subjectRepository.findAll().stream()
                .filter(s -> s.getClientId().startsWith("cascade-client-"))
                .forEach(subjectRepository::delete);
        userRepository.findByEmail("cascade@cascade.com").ifPresent(userRepository::delete);
    }

    @Test
    @DisplayName("Deletar usuário deve remover em cascata todos os seus subjects via ON DELETE CASCADE")
    void deleteUser_cascadesSubjectDeletion() throws Exception {
        // Verify subjects exist before deletion
        assertThat(subjectRepository.findAll())
                .anyMatch(s -> s.getClientId().equals("cascade-client-1"))
                .anyMatch(s -> s.getClientId().equals("cascade-client-2"));

        // Delete user via API
        mockMvc.perform(delete("/api/admin/users/" + cascadeUserId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        // Verify user is deleted
        assertThat(userRepository.findById(cascadeUserId)).isEmpty();

        // Verify subjects were cascade-deleted by the database FK
        assertThat(subjectRepository.findAll())
                .noneMatch(s -> s.getClientId().equals("cascade-client-1"))
                .noneMatch(s -> s.getClientId().equals("cascade-client-2"));
    }
}
