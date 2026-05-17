package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários de getters/setters da entidade {@link Discipline}.
 */
@DisplayName("Discipline — getters e setters da entidade")
class DisciplineEntityTest {

    @Test
    @DisplayName("construtor padrão deve criar instância com campos nulos")
    void defaultConstructor_createsInstance() {
        Discipline discipline = new Discipline();

        assertThat(discipline.getId()).isNull();
        assertThat(discipline.getUser()).isNull();
        assertThat(discipline.getArea()).isNull();
        assertThat(discipline.getName()).isNull();
        assertThat(discipline.getCreatedAt()).isNull();
    }

    @Test
    @DisplayName("setUser/setArea/setName devem persistir os valores corretamente")
    void settersAndGetters_workCorrectly() {
        Discipline discipline = new Discipline();
        User user = new User();
        Area area = new Area();
        area.setName("Ciências da Natureza");

        discipline.setUser(user);
        discipline.setArea(area);
        discipline.setName("Biologia");

        assertThat(discipline.getUser()).isSameAs(user);
        assertThat(discipline.getArea()).isSameAs(area);
        assertThat(discipline.getName()).isEqualTo("Biologia");
    }
}
