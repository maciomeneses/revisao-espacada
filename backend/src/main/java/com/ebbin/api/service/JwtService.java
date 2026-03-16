package com.ebbin.api.service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import org.springframework.beans.factory.annotation.Autowired;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.function.Function;
import java.util.function.Supplier;

@Service
public class JwtService {

    private final SecretKey key;
    private final long expirationMs;

    /**
     * Fornecedor do instante "agora" para a verificação de expiração.
     * Injetável via construtor de teste para controle de tempo em testes unitários.
     * Em produção usa sempre {@code Date::new} (tempo real do sistema).
     */
    private final Supplier<Date> clock;

    /** Construtor de produção — usa o relógio do sistema. */
    @Autowired
    public JwtService(
            @Value("${app.jwt.secret}") String secret,
            @Value("${app.jwt.expiration-ms}") long expirationMs) {
        this(secret, expirationMs, Date::new);
    }

    /**
     * Construtor testável — permite injetar um relógio customizado para controle de tempo.
     * Visibilidade de pacote para uso exclusivo em testes unitários.
     */
    JwtService(String secret, long expirationMs, Supplier<Date> clock) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
        this.expirationMs = expirationMs;
        this.clock = clock;
    }

    public String generateToken(String email) {
        Date now = clock.get();
        return Jwts.builder()
                .subject(email)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expirationMs))
                .signWith(key)
                .compact();
    }

    public String extractEmail(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /**
     * Valida se o token pertence ao e-mail informado e não está expirado.
     *
     * <p>A assinatura e a estrutura do token são verificadas por {@link #extractClaim};
     * a expiração é conferida manualmente via {@link #isTokenExpired} usando o relógio
     * injetado, permitindo que o parse ocorra sem clock-enforcement do JJWT.</p>
     */
    public boolean isTokenValid(String token, String email) {
        return extractEmail(token).equals(email) && !isTokenExpired(token);
    }

    private boolean isTokenExpired(String token) {
        return extractClaim(token, Claims::getExpiration).before(clock.get());
    }

    private <T> T extractClaim(String token, Function<Claims, T> resolver) {
        return resolver.apply(
                Jwts.parser()
                        .verifyWith(key)
                        .clockSkewSeconds(Integer.MAX_VALUE) // desabilita clock-enforcement do JJWT; expiração validada manualmente em isTokenExpired
                        .build()
                        .parseSignedClaims(token)
                        .getPayload());
    }
}
