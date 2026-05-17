package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários de getters/setters da entidade {@link RoutineSlot}.
 */
@DisplayName("RoutineSlot — getters e setters da entidade")
class RoutineSlotEntityTest {

    @Test
    @DisplayName("construtor padrão deve criar instância com campos nulos")
    void defaultConstructor_createsInstance() {
        RoutineSlot slot = new RoutineSlot();

        assertThat(slot.getId()).isNull();
        assertThat(slot.getUser()).isNull();
        assertThat(slot.getClientId()).isNull();
        assertThat(slot.getDayOfWeek()).isNull();
        assertThat(slot.getSlotType()).isNull();
        assertThat(slot.getArea()).isNull();
        assertThat(slot.getTitle()).isNull();
        assertThat(slot.getStartTime()).isNull();
        assertThat(slot.getEndTime()).isNull();
        assertThat(slot.getCreatedAt()).isNull();
        assertThat(slot.getUpdatedAt()).isNull();
    }

    @Test
    @DisplayName("todos os setters devem persistir os valores correspondentes")
    void allSetters_persistValues() {
        RoutineSlot slot = new RoutineSlot();
        UUID id = UUID.randomUUID();
        User user = new User();

        slot.setId(id);
        slot.setUser(user);
        slot.setClientId("client-123");
        slot.setDayOfWeek((short) 3);
        slot.setSlotType("study");
        slot.setArea("Matemática");
        slot.setTitle("Funções");
        slot.setStartTime("08:00");
        slot.setEndTime("10:00");

        assertThat(slot.getId()).isEqualTo(id);
        assertThat(slot.getUser()).isSameAs(user);
        assertThat(slot.getClientId()).isEqualTo("client-123");
        assertThat(slot.getDayOfWeek()).isEqualTo((short) 3);
        assertThat(slot.getSlotType()).isEqualTo("study");
        assertThat(slot.getArea()).isEqualTo("Matemática");
        assertThat(slot.getTitle()).isEqualTo("Funções");
        assertThat(slot.getStartTime()).isEqualTo("08:00");
        assertThat(slot.getEndTime()).isEqualTo("10:00");
    }

    @Test
    @DisplayName("campos opcionais (area, title, startTime, endTime) aceitam null")
    void optionalFields_acceptNull() {
        RoutineSlot slot = new RoutineSlot();

        slot.setArea(null);
        slot.setTitle(null);
        slot.setStartTime(null);
        slot.setEndTime(null);

        assertThat(slot.getArea()).isNull();
        assertThat(slot.getTitle()).isNull();
        assertThat(slot.getStartTime()).isNull();
        assertThat(slot.getEndTime()).isNull();
    }
}
