package com.ebbin.api.security;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Testes unitários para {@link UserDetailsServiceImpl}.
 *
 * <p>Cobre os dois branches do {@code loadUserByUsername}:
 * <ul>
 *   <li>Usuário encontrado — retorna {@link UserDetails} corretamente populado</li>
 *   <li>Usuário não encontrado — lança {@link UsernameNotFoundException} (lambda {@code orElseThrow})</li>
 * </ul>
 * </p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserDetailsServiceImpl — testes unitários")
class UserDetailsServiceImplTest {

    @Mock
    UserRepository userRepository;

    @InjectMocks
    UserDetailsServiceImpl service;

    @Test
    @DisplayName("loadUserByUsername deve retornar UserDetails com authority correta para usuário existente")
    void loadUserByUsername_existingUser_returnsUserDetails() {
        User user = new User();
        user.setEmail("user@test.com");
        user.setPassword("encodedHash");
        user.setRole(User.Role.USER);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        UserDetails details = service.loadUserByUsername("user@test.com");

        assertThat(details.getUsername()).isEqualTo("user@test.com");
        assertThat(details.getPassword()).isEqualTo("encodedHash");
        assertThat(details.getAuthorities()).hasSize(1);
        assertThat(details.getAuthorities().iterator().next().getAuthority()).isEqualTo("ROLE_USER");
    }

    @Test
    @DisplayName("loadUserByUsername para ADMIN deve retornar authority ROLE_ADMIN")
    void loadUserByUsername_adminUser_returnsAdminAuthority() {
        User admin = new User();
        admin.setEmail("admin@test.com");
        admin.setPassword("adminHash");
        admin.setRole(User.Role.ADMIN);

        when(userRepository.findByEmail("admin@test.com")).thenReturn(Optional.of(admin));

        UserDetails details = service.loadUserByUsername("admin@test.com");

        assertThat(details.getAuthorities().iterator().next().getAuthority()).isEqualTo("ROLE_ADMIN");
    }

    @Test
    @DisplayName("loadUserByUsername para usuário inexistente deve lançar UsernameNotFoundException")
    void loadUserByUsername_nonExistentUser_throwsUsernameNotFoundException() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.loadUserByUsername("ghost@test.com"))
                .isInstanceOf(UsernameNotFoundException.class)
                .hasMessageContaining("ghost@test.com");
    }
}
