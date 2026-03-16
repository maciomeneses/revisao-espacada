package com.ebbin.api.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Testes unitários para {@link ProductionConfigValidator}.
 *
 * <p>Verifica que o validador falha corretamente (fail-fast) quando variáveis de segurança
 * críticas não estão configuradas ou usam valores default inseguros, e que passa quando
 * os valores são válidos.</p>
 */
@DisplayName("ProductionConfigValidator — fail-fast de configuração de produção")
class ProductionConfigValidatorTest {

    private ProductionConfigValidator validator(String jwtSecret, String adminPassword) {
        return new ProductionConfigValidator(jwtSecret, adminPassword);
    }

    @Test
    @DisplayName("Deve passar quando JWT_SECRET e ADMIN_PASSWORD são valores seguros")
    void validate_secureValues_shouldNotThrow() {
        ProductionConfigValidator v = validator(
                "umSegredoJwtMuitoLongoESeguroComMaisDe256BitsParaProducao1234567890",
                "Senha@Prod#Segura!2025"
        );

        assertThatCode(v::validate).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando JWT_SECRET usa o valor default inseguro")
    void validate_insecureJwtDefault_shouldThrow() {
        ProductionConfigValidator v = validator(
                ProductionConfigValidator.INSECURE_JWT_DEFAULT,
                "Senha@Prod#Segura!2025"
        );

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando ADMIN_PASSWORD usa o valor default inseguro")
    void validate_insecureAdminPasswordDefault_shouldThrow() {
        ProductionConfigValidator v = validator(
                "umSegredoJwtMuitoLongoESeguroComMaisDe256BitsParaProducao1234567890",
                ProductionConfigValidator.INSECURE_ADMIN_PASSWORD_DEFAULT
        );

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ADMIN_PASSWORD");
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando JWT_SECRET é nulo")
    void validate_nullJwtSecret_shouldThrow() {
        ProductionConfigValidator v = validator(null, "Senha@Prod#Segura!2025");

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando JWT_SECRET está em branco")
    void validate_blankJwtSecret_shouldThrow() {
        ProductionConfigValidator v = validator("   ", "Senha@Prod#Segura!2025");

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET");
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando ADMIN_PASSWORD é nulo")
    void validate_nullAdminPassword_shouldThrow() {
        ProductionConfigValidator v = validator(
                "umSegredoJwtMuitoLongoESeguroComMaisDe256BitsParaProducao1234567890",
                null
        );

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ADMIN_PASSWORD");
    }

    @Test
    @DisplayName("Deve lançar IllegalStateException quando ADMIN_PASSWORD está em branco")
    void validate_blankAdminPassword_shouldThrow() {
        ProductionConfigValidator v = validator(
                "umSegredoJwtMuitoLongoESeguroComMaisDe256BitsParaProducao1234567890",
                "   "
        );

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ADMIN_PASSWORD");
    }

    @Test
    @DisplayName("Deve incluir ambos os erros na mensagem quando ambas as variáveis são inválidas")
    void validate_bothInsecure_messageContainsBothErrors() {
        ProductionConfigValidator v = validator(
                ProductionConfigValidator.INSECURE_JWT_DEFAULT,
                ProductionConfigValidator.INSECURE_ADMIN_PASSWORD_DEFAULT
        );

        assertThatThrownBy(v::validate)
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET")
                .hasMessageContaining("ADMIN_PASSWORD");
    }
}
