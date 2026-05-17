package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários de getters/setters da entidade {@link Area}.
 */
@DisplayName("Area — getters e setters da entidade")
class AreaEntityTest {

    @Test
    @DisplayName("construtor padrão deve criar instância com campos nulos")
    void defaultConstructor_createsInstance() {
        Area area = new Area();

        assertThat(area.getId()).isNull();
        assertThat(area.getUser()).isNull();
        assertThat(area.getName()).isNull();
        assertThat(area.getCreatedAt()).isNull();
    }

    @Test
    @DisplayName("setUser/setName devem persistir os valores corretamente")
    void settersAndGetters_workCorrectly() {
        Area area = new Area();
        User user = new User();
        user.setEmail("test@test.com");

        area.setUser(user);
        area.setName("Ciências da Natureza");

        assertThat(area.getUser()).isSameAs(user);
        assertThat(area.getName()).isEqualTo("Ciências da Natureza");
    }
}
