package com.ebbin.api.service;

import com.ebbin.api.dto.LoginRequest;
import com.ebbin.api.dto.LoginResponse;
import com.ebbin.api.dto.RegisterRequest;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AuthService — fluxos de autenticação e registro")
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;
    @Mock AuthenticationManager authenticationManager;

    @InjectMocks
    AuthService authService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@test.com");
        user.setPassword("encodedPassword");
        user.setRole(User.Role.USER);
    }

    // --- login ---

    @Test
    @DisplayName("login bem-sucedido deve retornar LoginResponse com token")
    void login_success() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(jwtService.generateToken("user@test.com")).thenReturn("jwt-token");

        LoginResponse response = authService.login(new LoginRequest("user@test.com", "senha123"));

        assertThat(response.token()).isEqualTo("jwt-token");
        assertThat(response.email()).isEqualTo("user@test.com");
        verify(authenticationManager).authenticate(any(UsernamePasswordAuthenticationToken.class));
    }

    @Test
    @DisplayName("login com credenciais inválidas deve propagar BadCredentialsException")
    void login_invalidCredentials_throwsBadCredentials() {
        doThrow(new BadCredentialsException("Credenciais inválidas"))
                .when(authenticationManager).authenticate(any());

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@test.com", "errada")))
                .isInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("login deve lançar IllegalStateException quando repositório retorna vazio após autenticação bem-sucedida (invariante violado)")
    void login_userNotFoundAfterAuthentication_throwsIllegalState() {
        // Estado estruturalmente impossível em produção: autenticação bem-sucedida implica
        // que UserDetailsServiceImpl encontrou o usuário no banco. Este teste verifica a
        // guarda defensiva contra corrupção de dados ou race condition extremamente improvável.
        when(userRepository.findByEmail("user@test.com")).thenReturn(java.util.Optional.empty());

        assertThatThrownBy(() -> authService.login(new LoginRequest("user@test.com", "senha123")))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("user@test.com");
    }

    // --- register ---

    @Test
    @DisplayName("registro bem-sucedido deve salvar usuário e retornar token")
    void register_success() {
        when(userRepository.existsByEmail("novo@test.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("encodedSenha");
        when(jwtService.generateToken("novo@test.com")).thenReturn("jwt-token");

        User saved = new User();
        saved.setEmail("novo@test.com");
        saved.setPassword("encodedSenha");
        saved.setRole(User.Role.USER);
        when(userRepository.save(any(User.class))).thenReturn(saved);

        LoginResponse response = authService.register(
                new RegisterRequest("novo@test.com", "senha123", User.Role.USER));

        assertThat(response.token()).isEqualTo("jwt-token");
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("registro com e-mail duplicado deve lançar IllegalArgumentException")
    void register_duplicateEmail_throwsIllegalArgument() {
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(
                new RegisterRequest("user@test.com", "senha123", User.Role.USER)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("E-mail já cadastrado");
    }

    @Test
    @DisplayName("role padrão deve ser USER quando não informada no RegisterRequest")
    void register_defaultRole_isUser() {
        // O compact constructor do RegisterRequest converte null -> USER
        RegisterRequest req = new RegisterRequest("novo@test.com", "senha123", null);
        assertThat(req.role()).isEqualTo(User.Role.USER);
    }
}
