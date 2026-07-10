package com.ebbin.api.controller;

import com.ebbin.api.model.User;
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
    "spring.datasource.url=jdbc:h2:mem:admintest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@admintest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("AdminUserController — testes de integração")
class AdminUserControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtService jwtService;

    private String adminToken;
    private User regularUser;

    @BeforeEach
    void setUp() {
        // Get admin token (AdminInitializer creates admin@admintest.com)
        User admin = userRepository.findByEmail("admin@admintest.com")
                .orElseThrow(() -> new IllegalStateException("Admin não criado pelo AdminInitializer"));
        adminToken = jwtService.generateToken(admin.getEmail());

        // Create a regular user for test operations
        regularUser = new User();
        regularUser.setEmail("regular@admintest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        regularUser = userRepository.save(regularUser);
    }

    // --- GET /api/admin/users ---

    @Test
    @DisplayName("GET /api/admin/users deve retornar lista de usuários para admin")
    void listUsers_asAdmin_returns200() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    @DisplayName("GET /api/admin/users sem token deve retornar 401 ou 403")
    void listUsers_unauthenticated_returns4xx() throws Exception {
        // Spring Security retorna 403 para @PreAuthorize quando não autenticado
        mockMvc.perform(get("/api/admin/users"))
                .andExpect(status().is4xxClientError());
    }

    @Test
    @DisplayName("GET /api/admin/users com token de usuário comum deve retornar 403")
    void listUsers_asRegularUser_returns403() throws Exception {
        String userToken = jwtService.generateToken(regularUser.getEmail());
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden());
    }

    // --- POST /api/admin/users ---

    @Test
    @DisplayName("POST /api/admin/users deve criar novo usuário")
    void createUser_asAdmin_returns200() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"new@admintest.com","password":"senha123","role":"USER"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("new@admintest.com"))
                .andExpect(jsonPath("$.password").isEmpty()); // Senha nunca é retornada
    }

    @Test
    @DisplayName("POST /api/admin/users sem senha deve retornar 400 (grupo OnCreate)")
    void createUser_missingPassword_returns400() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nopass@admintest.com","role":"USER"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/admin/users com e-mail inválido deve retornar 400")
    void createUser_invalidEmail_returns400() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"nao_e_email","password":"senha123","role":"USER"}
                                """))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/admin/users com e-mail duplicado deve retornar 409")
    void createUser_duplicateEmail_returns409() throws Exception {
        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"regular@admintest.com","password":"senha123","role":"USER"}
                                """))
                .andExpect(status().isConflict());
    }

    // --- PUT /api/admin/users/{id} ---

    @Test
    @DisplayName("PUT /api/admin/users/{id} deve atualizar usuário existente")
    void updateUser_asAdmin_returns200() throws Exception {
        mockMvc.perform(put("/api/admin/users/" + regularUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"updated@admintest.com","role":"ADMIN"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("updated@admintest.com"))
                .andExpect(jsonPath("$.role").value("ADMIN"));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id} com ID inexistente deve retornar 404")
    void updateUser_notFound_returns404() throws Exception {
        java.util.UUID nonExistentId = java.util.UUID.randomUUID();
        mockMvc.perform(put("/api/admin/users/" + nonExistentId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"x@x.com","role":"USER"}
                                """))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id} com e-mail de outro usuário deve retornar 409")
    void updateUser_duplicateEmail_returns409() throws Exception {
        // Tenta atualizar o usuário comum para o e-mail do admin (já cadastrado)
        mockMvc.perform(put("/api/admin/users/" + regularUser.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@admintest.com","role":"USER"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("E-mail já cadastrado"));
    }

    @Test
    @DisplayName("PUT /api/admin/users/{id} que rebaixaria o único ADMIN deve retornar 409")
    void updateUser_demoteLastAdmin_returns409() throws Exception {
        // O AdminInitializer cria admin@admintest.com como único ADMIN deste contexto
        User admin = userRepository.findByEmail("admin@admintest.com").orElseThrow();
        mockMvc.perform(put("/api/admin/users/" + admin.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"admin@admintest.com","role":"USER"}
                                """))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Não é possível rebaixar o único ADMIN do sistema"));

        // Papel permanece ADMIN no banco
        assertThat(userRepository.findByEmail("admin@admintest.com"))
                .hasValueSatisfying(u -> assertThat(u.getRole()).isEqualTo(User.Role.ADMIN));
    }

    // --- DELETE /api/admin/users/{id} ---

    @Test
    @DisplayName("DELETE /api/admin/users/{id} deve remover usuário e retornar 204")
    void deleteUser_asAdmin_returns204() throws Exception {
        mockMvc.perform(delete("/api/admin/users/" + regularUser.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNoContent());

        assertThat(userRepository.findById(regularUser.getId())).isEmpty();
    }

    @Test
    @DisplayName("DELETE /api/admin/users/{id} com ID inexistente deve retornar 404")
    void deleteUser_notFound_returns404() throws Exception {
        // Use a valid UUID that doesn't exist in the DB
        java.util.UUID nonExistentId = java.util.UUID.randomUUID();
        mockMvc.perform(delete("/api/admin/users/" + nonExistentId)
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("DELETE /api/admin/users/{id} do único ADMIN deve retornar 409")
    void deleteUser_lastAdmin_returns409() throws Exception {
        // O AdminInitializer cria admin@admintest.com como único ADMIN deste contexto
        User admin = userRepository.findByEmail("admin@admintest.com").orElseThrow();
        mockMvc.perform(delete("/api/admin/users/" + admin.getId())
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.detail").value("Não é possível remover o único ADMIN do sistema"));

        // Admin continua existindo no banco
        assertThat(userRepository.findByEmail("admin@admintest.com")).isPresent();
    }

}
