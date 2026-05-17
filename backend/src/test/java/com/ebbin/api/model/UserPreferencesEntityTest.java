package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários de getters/setters da entidade {@link UserPreferences}.
 */
@DisplayName("UserPreferences — getters e setters da entidade")
class UserPreferencesEntityTest {

    @Test
    @DisplayName("construtor padrão deve inicializar allowedReviewDays com todos os dias da semana")
    void defaultConstructor_initializesAllowedReviewDays() {
        UserPreferences prefs = new UserPreferences();

        assertThat(prefs.getUserId()).isNull();
        assertThat(prefs.getUser()).isNull();
        assertThat(prefs.getCreatedAt()).isNull();
        assertThat(prefs.getUpdatedAt()).isNull();
        assertThat(prefs.getAllowedReviewDays())
                .containsExactly((short) 0, (short) 1, (short) 2, (short) 3, (short) 4, (short) 5, (short) 6);
    }

    @Test
    @DisplayName("setUserId/setUser/setAllowedReviewDays devem persistir os valores corretamente")
    void settersAndGetters_workCorrectly() {
        UserPreferences prefs = new UserPreferences();
        UUID userId = UUID.randomUUID();
        User user = new User();
        Short[] days = new Short[] { 1, 3, 5 };

        prefs.setUserId(userId);
        prefs.setUser(user);
        prefs.setAllowedReviewDays(days);

        assertThat(prefs.getUserId()).isEqualTo(userId);
        assertThat(prefs.getUser()).isSameAs(user);
        assertThat(prefs.getAllowedReviewDays()).containsExactly((short) 1, (short) 3, (short) 5);
    }

    @Test
    @DisplayName("setAllowedReviewDays aceita array vazio")
    void setAllowedReviewDays_acceptsEmptyArray() {
        UserPreferences prefs = new UserPreferences();
        prefs.setAllowedReviewDays(new Short[0]);

        assertThat(prefs.getAllowedReviewDays()).isEmpty();
    }
}
