package com.ebbin.api.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@DisplayName("JwtService — geração e validação de tokens")
class JwtServiceTest {

    private static final String SECRET = "TestSecretKeyForJwtThatIsAtLeast256BitsLongForTesting";
    private static final long EXPIRATION_MS = 86_400_000L; // 24h

    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService(SECRET, EXPIRATION_MS);
    }

    @Test
    @DisplayName("deve gerar um token não nulo para e-mail válido")
    void generateToken_shouldReturnNonNullToken() {
        String token = jwtService.generateToken("user@test.com");
        assertThat(token).isNotBlank();
    }

    @Test
    @DisplayName("deve extrair o e-mail correto do token")
    void extractEmail_shouldReturnCorrectEmail() {
        String email = "user@test.com";
        String token = jwtService.generateToken(email);
        assertThat(jwtService.extractEmail(token)).isEqualTo(email);
    }

    @Test
    @DisplayName("deve validar token correspondente ao e-mail")
    void isTokenValid_shouldReturnTrueForMatchingEmail() {
        String email = "user@test.com";
        String token = jwtService.generateToken(email);
        assertThat(jwtService.isTokenValid(token, email)).isTrue();
    }

    @Test
    @DisplayName("deve rejeitar token com e-mail diferente")
    void isTokenValid_shouldReturnFalseForDifferentEmail() {
        String token = jwtService.generateToken("user@test.com");
        assertThat(jwtService.isTokenValid(token, "outro@test.com")).isFalse();
    }

    @Test
    @DisplayName("deve rejeitar token expirado (email correto mas token vencido pelo relógio injetado)")
    void isTokenValid_shouldReturnFalseForExpiredToken() {
        // Gera um token com validade de 24h a partir do relógio real.
        // O JJWT parser usa o relógio do sistema para verificar exp durante o parse:
        // como o token expira em +24h, o parse ocorre sem erros (clockSkewSeconds=30).
        // A verificação manual em isTokenExpired() usa o relógio injetado (futureDate +2d),
        // que está APÓS a expiração do token → retorna true → isTokenValid retorna false.
        String email = "user@test.com";
        String token = jwtService.generateToken(email);

        Date futureDate = new Date(System.currentTimeMillis() + 2 * 86_400_000L);
        JwtService futureClockService = new JwtService(SECRET, EXPIRATION_MS, () -> futureDate);

        assertThat(futureClockService.isTokenValid(token, email)).isFalse();
    }

    @Test
    @DisplayName("deve lançar exceção para token mal-formado")
    void extractEmail_shouldThrowForMalformedToken() {
        assertThatThrownBy(() -> jwtService.extractEmail("nao.e.um.jwt"))
                .isInstanceOf(io.jsonwebtoken.JwtException.class);
    }
}
