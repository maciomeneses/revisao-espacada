package com.ebbin.api.config;

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
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Testes de integração para a camada de segurança de URL ({@code authorizeHttpRequests})
 * de {@link SecurityConfig}.
 *
 * <p>Verifica que o {@code accessDeniedHandler} RFC 9457 registrado em
 * {@code exceptionHandling()} é invocado quando um usuário autenticado tenta acessar
 * um recurso protegido por restrição de URL ({@code .requestMatchers("/api/admin/**").hasRole("ADMIN")}).
 * Neste cenário a negação ocorre no filtro de segurança, antes de atingir o
 * {@code DispatcherServlet}, portanto o {@link com.ebbin.api.exception.GlobalExceptionHandler}
 * não interfere.</p>
 */
@SpringBootTest
@AutoConfigureMockMvc
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.ANY)
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:securityconfigtest",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.jpa.properties.hibernate.schema_management_tool.check_constraint=false",
    "app.jwt.secret=TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting",
    "app.jwt.expiration-ms=86400000",
    "app.cors.allowed-origins=http://localhost:5173",
    "app.admin.email=admin@securityconfigtest.com",
    "app.admin.password=admin123"
})
@Transactional
@DisplayName("SecurityConfig — accessDeniedHandler (URL-level RBAC, RFC 9457)")
class SecurityConfigTest {

    @Autowired
    MockMvc mockMvc;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PasswordEncoder passwordEncoder;

    @Autowired
    JwtService jwtService;

    private String userToken;

    @BeforeEach
    void setUp() {
        User regularUser = new User();
        regularUser.setEmail("user@securityconfigtest.com");
        regularUser.setPassword(passwordEncoder.encode("senha123"));
        regularUser.setRole(User.Role.USER);
        userRepository.save(regularUser);
        userToken = jwtService.generateToken(regularUser.getEmail());
    }

    /**
     * Um usuário com role USER acessando {@code /api/admin/**} deve receber 403 RFC 9457
     * gerado pelo {@code accessDeniedHandler} na camada de URL de {@link SecurityConfig},
     * antes de atingir o {@code DispatcherServlet}.
     */
    @Test
    @DisplayName("GET /api/admin/users com token USER deve retornar 403 RFC 9457 via accessDeniedHandler")
    void adminEndpoint_withUserRole_returns403Rfc9457ViaFilterChainHandler() throws Exception {
        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer " + userToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.type").value("urn:problem:forbidden"))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.title").isNotEmpty())
                .andExpect(jsonPath("$.detail").isNotEmpty());
    }
}
