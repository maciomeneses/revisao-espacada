package com.ebbin.api.controller;

import com.ebbin.api.dto.UserPreferencesDto;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.UserPreferencesService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

/**
 * Cobre branches do {@link UserPreferencesController} não alcançáveis via MockMvc.
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("UserPreferencesController — testes unitários")
class UserPreferencesControllerUnitTest {

    @Mock UserPreferencesService preferencesService;
    @Mock UserRepository userRepository;

    @InjectMocks UserPreferencesController controller;

    private final UserDetails principal = User.withUsername("u@x.com")
            .password("x").roles("USER").build();

    @Test
    @DisplayName("get com usuário inexistente lança UsernameNotFoundException")
    void get_unknownUser_throws() {
        when(userRepository.findByEmail("u@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.get(principal))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("update com payload null lança 400")
    void update_nullDto_throws400() {
        assertThatThrownBy(() -> controller.update(principal, null))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("update com allowedReviewDays null lança 400")
    void update_nullField_throws400() {
        UserPreferencesDto dto = new UserPreferencesDto(null);

        assertThatThrownBy(() -> controller.update(principal, dto))
                .isInstanceOf(ResponseStatusException.class);
    }
}
