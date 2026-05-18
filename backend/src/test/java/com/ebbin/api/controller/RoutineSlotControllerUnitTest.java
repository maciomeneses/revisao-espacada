package com.ebbin.api.controller;

import com.ebbin.api.dto.RoutineSlotDto;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.RoutineSlotService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.userdetails.User.UserBuilder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

/**
 * Cobre branches do {@link RoutineSlotController} que não são alcançáveis via
 * MockMvc (notadamente o ramo {@code slots == null} do log, já que Spring rejeita
 * body "null" antes do controller).
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("RoutineSlotController — testes unitários")
class RoutineSlotControllerUnitTest {

    @Mock RoutineSlotService routineService;
    @Mock UserRepository userRepository;

    @InjectMocks RoutineSlotController controller;

    private final UserDetails principal = org.springframework.security.core.userdetails.User
            .withUsername("u@x.com").password("x").roles("USER").build();

    @Test
    @DisplayName("replaceAll com slots null aciona o ramo null do log e delega ao service")
    void replaceAll_nullSlots_logsNullBranch() {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setEmail("u@x.com");

        when(userRepository.findByEmail("u@x.com")).thenReturn(Optional.of(user));
        when(routineService.replaceAll(any(), any())).thenReturn(List.of());

        ResponseEntity<List<RoutineSlotDto>> result = controller.replaceAll(principal, null);

        assertThat(result.getStatusCode().value()).isEqualTo(200);
    }

    @Test
    @DisplayName("list com usuário inexistente lança UsernameNotFoundException")
    void list_unknownUser_throws() {
        when(userRepository.findByEmail("u@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> controller.list(principal))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
