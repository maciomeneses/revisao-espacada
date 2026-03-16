package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários de getters/setters da entidade {@link Subject}.
 *
 * <p>Cobre os getters de campos gerenciados pelo JPA (id, user, timestamps) que
 * não são exercitados pelos testes de integração existentes, garantindo que a
 * cobertura de instrução inclua todos os acessores do modelo.</p>
 */
@DisplayName("Subject — getters e setters da entidade")
class SubjectEntityTest {

    @Test
    @DisplayName("getId deve retornar null quando não persistida (sem geração de ID)")
    void getId_returnsNullForUnpersistedEntity() {
        Subject subject = new Subject();
        // ID gerado pelo JPA na persistência — antes de salvar é null
        assertThat(subject.getId()).isNull();
    }

    @Test
    @DisplayName("getUser deve retornar o User associado após setUser")
    void getUser_returnsAssignedUser() {
        Subject subject = new Subject();
        User user = new User();
        user.setEmail("owner@test.com");
        subject.setUser(user);

        assertThat(subject.getUser()).isSameAs(user);
        assertThat(subject.getUser().getEmail()).isEqualTo("owner@test.com");
    }

    @Test
    @DisplayName("getCreatedAt e getUpdatedAt devem retornar null para entidade não persistida")
    void getTimestamps_returnNullForUnpersistedEntity() {
        Subject subject = new Subject();
        // @CreationTimestamp e @UpdateTimestamp são preenchidos pelo Hibernate na persistência
        assertThat(subject.getCreatedAt()).isNull();
        assertThat(subject.getUpdatedAt()).isNull();
    }

    @Test
    @DisplayName("setClientId/getClientId e demais setters devem funcionar corretamente")
    void settersAndGetters_workCorrectly() {
        Subject subject = new Subject();
        subject.setClientId("client-001");
        subject.setModulo("Módulo 1");
        subject.setArea("Direito Civil");
        subject.setAulaPrincipal("Aula 01");
        subject.setRelevancia("alta");
        subject.setNextReviewDate(LocalDate.of(2026, 4, 1));
        subject.setLastReviewDate(LocalDate.of(2026, 3, 1));
        subject.setLastPerformance(PerformanceLevel.BOM);
        subject.setPerformanceLevel(PerformanceLevel.EXCELENTE);
        subject.setCurrentStage(ReviewStage.REVIEW);

        assertThat(subject.getClientId()).isEqualTo("client-001");
        assertThat(subject.getModulo()).isEqualTo("Módulo 1");
        assertThat(subject.getArea()).isEqualTo("Direito Civil");
        assertThat(subject.getAulaPrincipal()).isEqualTo("Aula 01");
        assertThat(subject.getRelevancia()).isEqualTo("alta");
        assertThat(subject.getNextReviewDate()).isEqualTo(LocalDate.of(2026, 4, 1));
        assertThat(subject.getLastReviewDate()).isEqualTo(LocalDate.of(2026, 3, 1));
        assertThat(subject.getLastPerformance()).isEqualTo(PerformanceLevel.BOM);
        assertThat(subject.getPerformanceLevel()).isEqualTo(PerformanceLevel.EXCELENTE);
        assertThat(subject.getCurrentStage()).isEqualTo(ReviewStage.REVIEW);
    }
}
