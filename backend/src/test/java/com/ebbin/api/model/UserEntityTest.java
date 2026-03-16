package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários de getters/setters da entidade {@link User}.
 *
 * <p>Cobre os campos gerenciados pelo JPA (id via setId, timestamps) que não são
 * exercitados pelos testes de integração, garantindo cobertura de instrução completa
 * para os acessores do modelo de usuário.</p>
 */
@DisplayName("User — getters e setters da entidade")
class UserEntityTest {

    @Test
    @DisplayName("setId/getId deve retornar o UUID atribuído manualmente")
    void setId_getId_roundTrip() {
        User user = new User();
        UUID id = UUID.randomUUID();
        user.setId(id);

        assertThat(user.getId()).isEqualTo(id);
    }

    @Test
    @DisplayName("getCreatedAt e getUpdatedAt devem retornar null para entidade não persistida")
    void getTimestamps_returnNullForUnpersistedEntity() {
        User user = new User();
        // @CreationTimestamp e @UpdateTimestamp são preenchidos pelo Hibernate na persistência
        assertThat(user.getCreatedAt()).isNull();
        assertThat(user.getUpdatedAt()).isNull();
    }

    @Test
    @DisplayName("role padrão deve ser USER quando não configurado explicitamente")
    void defaultRole_isUser() {
        User user = new User();
        assertThat(user.getRole()).isEqualTo(User.Role.USER);
    }

    @Test
    @DisplayName("setEmail/setPassword/setRole devem persistir os valores corretamente")
    void settersAndGetters_workCorrectly() {
        User user = new User();
        user.setEmail("admin@test.com");
        user.setPassword("encodedHash");
        user.setRole(User.Role.ADMIN);

        assertThat(user.getEmail()).isEqualTo("admin@test.com");
        assertThat(user.getPassword()).isEqualTo("encodedHash");
        assertThat(user.getRole()).isEqualTo(User.Role.ADMIN);
    }
}
