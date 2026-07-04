package com.ebbin.api.service;

import com.ebbin.api.model.User;
import com.ebbin.api.model.UserPreferences;
import com.ebbin.api.repository.UserPreferencesRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("UserPreferencesService — preferências de revisão")
class UserPreferencesServiceTest {

    @Mock UserPreferencesRepository repository;
    @Mock UserRepository userRepository;
    @InjectMocks UserPreferencesService service;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setEmail("user@test.com");
        user.setRole(User.Role.USER);
    }

    @Test
    @DisplayName("findOrCreate retorna preferências existentes")
    void findOrCreate_returnsExisting() {
        UserPreferences existing = new UserPreferences();
        existing.setUser(user);
        existing.setAllowedReviewDays(new Short[] { 1, 2, 3 });
        when(repository.findById(userId)).thenReturn(Optional.of(existing));

        UserPreferences result = service.findOrCreate(userId);

        assertThat(result.getAllowedReviewDays()).containsExactly((short) 1, (short) 2, (short) 3);
    }

    @Test
    @DisplayName("findOrCreate cria preferências com defaults se ausentes")
    void findOrCreate_createsDefaults() {
        when(repository.findById(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(repository.save(any(UserPreferences.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPreferences result = service.findOrCreate(userId);

        assertThat(result.getAllowedReviewDays())
                .containsExactly((short) 0, (short) 1, (short) 2, (short) 3, (short) 4, (short) 5, (short) 6);
        assertThat(result.getUser()).isEqualTo(user);
    }

    @Test
    @DisplayName("findOrCreate lança UsernameNotFoundException para usuário inexistente")
    void findOrCreate_userNotFound() {
        when(repository.findById(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.findOrCreate(userId))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("update válido persiste novos dias")
    void update_validDays_persists() {
        UserPreferences existing = new UserPreferences();
        existing.setUser(user);
        existing.setAllowedReviewDays(new Short[] { 0, 1, 2, 3, 4, 5, 6 });
        when(repository.findById(userId)).thenReturn(Optional.of(existing));
        when(repository.save(any(UserPreferences.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPreferences result = service.update(userId, Set.of((short) 1, (short) 3, (short) 5), null);

        assertThat(result.getAllowedReviewDays()).containsExactlyInAnyOrder((short) 1, (short) 3, (short) 5);
    }

    @Test
    @DisplayName("update cria preferências quando ainda não existem")
    void update_createsIfMissing() {
        when(repository.findById(userId)).thenReturn(Optional.empty());
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(repository.save(any(UserPreferences.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPreferences result = service.update(userId, Set.of((short) 2, (short) 4), null);

        assertThat(result.getAllowedReviewDays()).containsExactlyInAnyOrder((short) 2, (short) 4);
    }

    @Test
    @DisplayName("update com conjunto vazio lança BAD_REQUEST")
    void update_emptySet_badRequest() {
        assertThatThrownBy(() -> service.update(userId, Set.of(), null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("vazio");
    }

    @Test
    @DisplayName("update com conjunto nulo lança BAD_REQUEST")
    void update_nullSet_badRequest() {
        assertThatThrownBy(() -> service.update(userId, null, null))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("update com dia=7 lança BAD_REQUEST")
    void update_daySevenInvalid() {
        assertThatThrownBy(() -> service.update(userId, Set.of((short) 7), null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Dia inválido");
    }

    @Test
    @DisplayName("update com dia=-1 lança BAD_REQUEST")
    void update_dayNegativeInvalid() {
        assertThatThrownBy(() -> service.update(userId, Set.of((short) -1), null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Dia inválido");
    }

    @Test
    @DisplayName("update com maxReviewsPerDay válido persiste o limite")
    void update_maxPerDay_persists() {
        UserPreferences existing = new UserPreferences();
        existing.setUser(user);
        when(repository.findById(userId)).thenReturn(Optional.of(existing));
        when(repository.save(any(UserPreferences.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPreferences result = service.update(userId, Set.of((short) 1), 5);

        assertThat(result.getMaxReviewsPerDay()).isEqualTo((short) 5);
    }

    @Test
    @DisplayName("update com maxReviewsPerDay null limpa o limite")
    void update_maxPerDayNull_clearsLimit() {
        UserPreferences existing = new UserPreferences();
        existing.setUser(user);
        existing.setMaxReviewsPerDay((short) 3);
        when(repository.findById(userId)).thenReturn(Optional.of(existing));
        when(repository.save(any(UserPreferences.class))).thenAnswer(inv -> inv.getArgument(0));

        UserPreferences result = service.update(userId, Set.of((short) 1), null);

        assertThat(result.getMaxReviewsPerDay()).isNull();
    }

    @Test
    @DisplayName("update com maxReviewsPerDay=0 lança BAD_REQUEST")
    void update_maxPerDayZero_badRequest() {
        assertThatThrownBy(() -> service.update(userId, Set.of((short) 1), 0))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("maxReviewsPerDay");
    }

    @Test
    @DisplayName("update com maxReviewsPerDay negativo lança BAD_REQUEST")
    void update_maxPerDayNegative_badRequest() {
        assertThatThrownBy(() -> service.update(userId, Set.of((short) 1), -2))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("maxReviewsPerDay");
    }

    @Test
    @DisplayName("update com maxReviewsPerDay acima de SMALLINT lança BAD_REQUEST")
    void update_maxPerDayOverflow_badRequest() {
        assertThatThrownBy(() -> service.update(userId, Set.of((short) 1), 40000))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("maxReviewsPerDay");
    }
}
