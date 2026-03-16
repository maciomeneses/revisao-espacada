package com.ebbin.api.model;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.LocalDateTime;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Testes unitários da entidade {@link PasswordResetToken}.
 *
 * <p>Cobre construtores, getters/setters e valores padrão para garantir cobertura
 * de instrução completa na classe de modelo.</p>
 */
@DisplayName("PasswordResetToken — construtores, getters e setters")
class PasswordResetTokenEntityTest {

    @Test
    @DisplayName("construtor vazio deve criar instância com used=false")
    void defaultConstructor_usedIsFalse() {
        PasswordResetToken token = new PasswordResetToken();
        assertThat(token.isUsed()).isFalse();
    }

    @Test
    @DisplayName("construtor parametrizado deve atribuir user, token e expiresAt")
    void parameterizedConstructor_assignsFields() {
        User user = new User();
        user.setEmail("user@test.com");

        String rawToken = "abc-uuid-token";
        LocalDateTime expiry = LocalDateTime.of(2026, 1, 1, 10, 15);

        PasswordResetToken token = new PasswordResetToken(user, rawToken, expiry);

        assertThat(token.getUser()).isSameAs(user);
        assertThat(token.getToken()).isEqualTo(rawToken);
        assertThat(token.getExpiresAt()).isEqualTo(expiry);
        assertThat(token.isUsed()).isFalse();
    }

    @Test
    @DisplayName("getId deve retornar null para entidade não persistida")
    void getId_returnsNullForUnpersisted() {
        PasswordResetToken token = new PasswordResetToken();
        assertThat(token.getId()).isNull();
    }

    @Test
    @DisplayName("getCreatedAt deve retornar null para entidade não persistida")
    void getCreatedAt_returnsNullForUnpersisted() {
        PasswordResetToken token = new PasswordResetToken();
        // @CreationTimestamp é preenchido pelo Hibernate na persistência
        assertThat(token.getCreatedAt()).isNull();
    }

    @Test
    @DisplayName("setUsed deve alterar o estado corretamente")
    void setUsed_changesState() {
        PasswordResetToken token = new PasswordResetToken();
        assertThat(token.isUsed()).isFalse();

        token.setUsed(true);
        assertThat(token.isUsed()).isTrue();

        token.setUsed(false);
        assertThat(token.isUsed()).isFalse();
    }

    @Test
    @DisplayName("setToken/setUser/setExpiresAt devem atualizar os campos corretamente")
    void setters_updateFieldsCorrectly() {
        PasswordResetToken token = new PasswordResetToken();

        User user = new User();
        user.setEmail("x@test.com");
        String rawToken = "new-uuid";
        LocalDateTime expiry = LocalDateTime.of(2026, 6, 1, 12, 0);

        token.setUser(user);
        token.setToken(rawToken);
        token.setExpiresAt(expiry);

        assertThat(token.getUser()).isSameAs(user);
        assertThat(token.getToken()).isEqualTo(rawToken);
        assertThat(token.getExpiresAt()).isEqualTo(expiry);
    }
}
