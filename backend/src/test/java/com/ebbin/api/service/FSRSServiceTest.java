package com.ebbin.api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.time.LocalDate;
import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

@DisplayName("FSRSService — algoritmo de repetição espaçada v6")
class FSRSServiceTest {

    private FSRSService fsrsService;

    @BeforeEach
    void setUp() {
        fsrsService = new FSRSService();
    }

    // --- init ---

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3, 4})
    @DisplayName("init deve retornar estado Learning com stability > 0 para qualquer rating")
    void init_allRatings_returnPositiveStability(int rating) {
        FSRSService.FSRSState state = fsrsService.init(rating);

        assertThat(state.stability).isGreaterThan(0);
        assertThat(state.difficulty).isBetween(1.0, 10.0);
        assertThat(state.reps).isEqualTo(1);
        assertThat(state.lapses).isEqualTo(0);
        assertThat(state.state).isEqualTo("Learning");
        assertThat(state.scheduledDays).isGreaterThanOrEqualTo(1);
        assertThat(state.nextReviewDate).isAfterOrEqualTo(LocalDate.now());
    }

    @Test
    @DisplayName("init com rating Easy (4) deve ter maior stability que rating Again (1)")
    void init_easyRatingHasHigherStabilityThanAgain() {
        FSRSService.FSRSState again = fsrsService.init(1);
        FSRSService.FSRSState easy = fsrsService.init(4);

        assertThat(easy.stability).isGreaterThan(again.stability);
    }

    // --- update ---

    @Test
    @DisplayName("update com rating Good deve aumentar stability")
    void update_goodRating_increasesStability() {
        FSRSService.FSRSState initial = fsrsService.init(3);
        LocalDateTime now = LocalDateTime.now().plusDays(initial.scheduledDays);

        FSRSService.FSRSState updated = fsrsService.update(initial, 3, now);

        assertThat(updated.stability).isGreaterThan(initial.stability);
        assertThat(updated.state).isEqualTo("Review");
        assertThat(updated.reps).isEqualTo(2);
        assertThat(updated.lapses).isEqualTo(0);
    }

    @Test
    @DisplayName("update com rating Again deve definir estado Relearning e incrementar lapses")
    void update_againRating_setsRelearningAndIncrementsLapses() {
        FSRSService.FSRSState initial = fsrsService.init(3);
        LocalDateTime now = LocalDateTime.now().plusDays(initial.scheduledDays);

        FSRSService.FSRSState updated = fsrsService.update(initial, 1, now);

        assertThat(updated.state).isEqualTo("Relearning");
        assertThat(updated.lapses).isEqualTo(1);
    }

    @Test
    @DisplayName("update deve manter scheduledDays >= 1")
    void update_scheduledDaysAlwaysAtLeastOne() {
        FSRSService.FSRSState initial = fsrsService.init(1); // Again — menor stability
        LocalDateTime now = LocalDateTime.now();

        FSRSService.FSRSState updated = fsrsService.update(initial, 1, now);

        assertThat(updated.scheduledDays).isGreaterThanOrEqualTo(1);
    }

    @Test
    @DisplayName("update deve manter difficulty entre 1 e 10")
    void update_difficultyAlwaysInBounds() {
        FSRSService.FSRSState initial = fsrsService.init(4); // Easy
        LocalDateTime now = LocalDateTime.now().plusDays(initial.scheduledDays);

        for (int i = 0; i < 10; i++) {
            initial = fsrsService.update(initial, 4, now);
            assertThat(initial.difficulty).isBetween(1.0, 10.0);
        }
    }

    @Test
    @DisplayName("update com Easy deve ser maior que Hard na stability resultante")
    void update_easyProducesHigherStabilityThanHard() {
        FSRSService.FSRSState baseState = fsrsService.init(3);
        LocalDateTime now = LocalDateTime.now().plusDays(baseState.scheduledDays);

        FSRSService.FSRSState afterHard = fsrsService.update(baseState, 2, now);
        FSRSService.FSRSState afterEasy = fsrsService.update(baseState, 4, now);

        assertThat(afterEasy.stability).isGreaterThan(afterHard.stability);
    }
}
