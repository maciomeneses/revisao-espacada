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
    private User adminUser;
    private UUID userId;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        existingUser = new User();
        existingUser.setEmail("user@test.com");
        existingUser.setPassword("encodedPassword");
        existingUser.setRole(User.Role.USER);

        adminId = UUID.randomUUID();
        adminUser = new User();
        adminUser.setEmail("admin@test.com");
        adminUser.setPassword("encodedPassword");
        adminUser.setRole(User.Role.ADMIN);
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
    @DisplayName("updateUser com senha em branco não deve recodificar a senha")
    void updateUser_blankPassword_doesNotEncode() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserDto dto = new UserDto(null, "user@test.com", "   ", User.Role.USER);
        userService.updateUser(userId, dto);

        // senha em branco não deve ser recodificada
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("updateUser sem role não deve alterar o role atual do usuário")
    void updateUser_nullRole_doesNotChangeRole() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        UserDto dto = new UserDto(null, "user@test.com", null, null);
        UserDto result = userService.updateUser(userId, dto);

        // role permanece USER (valor original) quando dto.role() é null
        assertThat(result.role()).isEqualTo(User.Role.USER);
        verify(passwordEncoder, never()).encode(anyString());
    }

    @Test
    @DisplayName("updateUser com ID inexistente deve lançar UsernameNotFoundException")
    void updateUser_notFound_throws() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        UserDto dto = new UserDto(null, "x@x.com", null, null);

        assertThatThrownBy(() -> userService.updateUser(userId, dto))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("updateUser com e-mail já pertencente a outro usuário deve lançar IllegalArgumentException")
    void updateUser_emailDeOutroUsuario_throws() {
        // given: o novo e-mail difere do atual e já existe no banco (pertence a outro usuário)
        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser));
        when(userRepository.existsByEmail("ocupado@test.com")).thenReturn(true);
        UserDto dto = new UserDto(null, "ocupado@test.com", null, User.Role.USER);

        // when / then
        assertThatThrownBy(() -> userService.updateUser(userId, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("E-mail já cadastrado");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUser que rebaixaria o único ADMIN para USER deve lançar IllegalArgumentException")
    void updateUser_rebaixarUnicoAdmin_throws() {
        // given: usuário ADMIN, rebaixamento para USER e apenas um ADMIN no sistema
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRole(User.Role.ADMIN)).thenReturn(1L);
        UserDto dto = new UserDto(null, "admin@test.com", null, User.Role.USER);

        // when / then
        assertThatThrownBy(() -> userService.updateUser(adminId, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("único ADMIN");
        verify(userRepository, never()).save(any());
    }

    @Test
    @DisplayName("updateUser deve rebaixar ADMIN para USER quando existe outro ADMIN")
    void updateUser_rebaixarAdminComOutroAdmin_sucesso() {
        // given: dois ADMINs no sistema — rebaixar um deles é permitido
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRole(User.Role.ADMIN)).thenReturn(2L);
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        UserDto result = userService.updateUser(adminId,
                new UserDto(null, "admin@test.com", null, User.Role.USER));

        // then
        assertThat(result.role()).isEqualTo(User.Role.USER);
        verify(userRepository).save(adminUser);
    }

    @Test
    @DisplayName("updateUser de ADMIN mantendo o role ADMIN não deve consultar a contagem de admins")
    void updateUser_adminMantendoRole_naoConsultaContagem() {
        // given: ADMIN atualizado sem rebaixamento (role continua ADMIN)
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // when
        UserDto result = userService.updateUser(adminId,
                new UserDto(null, "admin@test.com", null, User.Role.ADMIN));

        // then: guarda não dispara e a contagem nem é consultada (short-circuit)
        assertThat(result.role()).isEqualTo(User.Role.ADMIN);
        verify(userRepository, never()).countByRole(any());
    }

    // --- deleteUser ---

    @Test
    @DisplayName("deleteUser deve remover usuário existente")
    void deleteUser_success() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(existingUser));
        userService.deleteUser(userId);
        verify(userRepository).delete(existingUser);
    }

    @Test
    @DisplayName("deleteUser com ID inexistente deve lançar UsernameNotFoundException")
    void deleteUser_notFound_throws() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.deleteUser(userId))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("deleteUser do único ADMIN deve lançar IllegalArgumentException")
    void deleteUser_unicoAdmin_throws() {
        // given: o usuário a remover é o único ADMIN do sistema
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRole(User.Role.ADMIN)).thenReturn(1L);

        // when / then
        assertThatThrownBy(() -> userService.deleteUser(adminId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("único ADMIN");
        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    @DisplayName("deleteUser de ADMIN deve remover quando existe outro ADMIN")
    void deleteUser_adminComOutroAdmin_sucesso() {
        // given: dois ADMINs — remover um deles é permitido
        when(userRepository.findById(adminId)).thenReturn(Optional.of(adminUser));
        when(userRepository.countByRole(User.Role.ADMIN)).thenReturn(2L);

        // when
        userService.deleteUser(adminId);

        // then
        verify(userRepository).delete(adminUser);
    }
}
