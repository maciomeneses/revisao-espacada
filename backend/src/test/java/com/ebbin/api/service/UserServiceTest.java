package com.ebbin.api.service;

import com.ebbin.api.dto.UserDto;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserService — gerenciamento de usuários via admin")
class UserServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;

    @InjectMocks UserService userService;

    private User existingUser;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        existingUser = new User();
        existingUser.setEmail("user@test.com");
        existingUser.setPassword("encodedPassword");
        existingUser.setRole(User.Role.USER);
    }

    // --- findAll ---

    @Test
    @DisplayName("findAll deve retornar lista de UserDto sem senhas")
    void findAll_returnsDtoListWithoutPasswords() {
        when(userRepository.findAll()).thenReturn(List.of(existingUser));

        List<UserDto> result = userService.findAll();

        assertThat(result).hasSize(1);
        assertThat(result.get(0).password()).isNull(); // nunca retorna hash
    }

    // --- createUser ---

    @Test
    @DisplayName("createUser deve criar usuário e retornar DTO sem senha")
    void createUser_success() {
        UserDto dto = new UserDto(null, "novo@test.com", "senha123", User.Role.USER);
        when(userRepository.existsByEmail("novo@test.com")).thenReturn(false);
        when(passwordEncoder.encode("senha123")).thenReturn("encodedHash");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserDto result = userService.createUser(dto);

        assertThat(result.email()).isEqualTo("novo@test.com");
        assertThat(result.password()).isNull();
        verify(passwordEncoder).encode("senha123");
    }

    @Test
    @DisplayName("createUser com e-mail duplicado deve lançar IllegalArgumentException")
    void createUser_duplicateEmail_throws() {
        UserDto dto = new UserDto(null, "user@test.com", "senha123", User.Role.USER);
        when(userRepository.existsByEmail("user@test.com")).thenReturn(true);

        assertThatThrownBy(() -> userService.createUser(dto))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("createUser com senha nula deve lançar IllegalArgumentException antes de acessar repositório")
    void createUser_nullPassword_throwsBeforeRepository() {
        UserDto dto = new UserDto(null, "novo@test.com", null, User.Role.USER);

        assertThatThrownBy(() -> userService.createUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Senha é obrigatória");

        verify(userRepository, never()).existsByEmail(anyString());
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("createUser com senha em branco deve lançar IllegalArgumentException")
    void createUser_blankPassword_throws() {
        UserDto dto = new UserDto(null, "novo@test.com", "   ", User.Role.USER);

        assertThatThrownBy(() -> userService.createUser(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Senha é obrigatória");
    }

    @Test
    @DisplayName("createUser sem role deve usar USER como padrão")
    void createUser_nullRole_defaultsToUser() {
        UserDto dto = new UserDto(null, "novo@test.com", "senha123", null);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(anyString())).thenReturn("hash");
        when(userRepository.save(any())).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            assertThat(u.getRole()).isEqualTo(User.Role.USER);
            return u;
        });

        userService.createUser(dto);
        verify(userRepository).save(any());
    }

    // --- updateUser ---

    @Test
    @DisplayName("updateUser deve atualizar e-mail e role")
    void updateUser_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserDto dto = new UserDto(null, "atualizado@test.com", null, User.Role.ADMIN);
        UserDto result = userService.updateUser(userId, dto);

        assertThat(result.email()).isEqualTo("atualizado@test.com");
        assertThat(result.role()).isEqualTo(User.Role.ADMIN);
        verify(passwordEncoder, never()).encode(anyString()); // senha não trocada
    }

    @Test
    @DisplayName("updateUser com nova senha deve codificá-la")
    void updateUser_withNewPassword_encodesIt() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser));
        when(passwordEncoder.encode("novaSenha")).thenReturn("encodedNova");
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserDto dto = new UserDto(null, "user@test.com", "novaSenha", User.Role.USER);
        userService.updateUser(userId, dto);

        verify(passwordEncoder).encode("novaSenha");
    }

    @Test
    @DisplayName("updateUser com ID inexistente deve lançar UsernameNotFoundException")
    void updateUser_notFound_throws() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        UserDto dto = new UserDto(null, "x@x.com", null, null);

        assertThatThrownBy(() -> userService.updateUser(userId, dto))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    // --- deleteUser ---

    @Test
    @DisplayName("deleteUser deve remover usuário existente")
    void deleteUser_success() {
        when(userRepository.existsById(userId)).thenReturn(true);
        userService.deleteUser(userId);
        verify(userRepository).deleteById(userId);
    }

    @Test
    @DisplayName("deleteUser com ID inexistente deve lançar UsernameNotFoundException")
    void deleteUser_notFound_throws() {
        when(userRepository.existsById(userId)).thenReturn(false);

        assertThatThrownBy(() -> userService.deleteUser(userId))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
