package com.ebbin.api.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Token de uso único para confirmação de e-mail no auto-cadastro.
 *
 * <p>Mesmo padrão de {@link PasswordResetToken}: vinculado a um {@link User},
 * com TTL ({@code expiresAt}) e flag {@code used} marcado após a confirmação.
 * Um token inválido é aquele que (a) não existe, (b) já foi utilizado, ou
 * (c) está expirado.</p>
 *
 * <p>Mapeamento Flyway: {@code V14__signup_email_verification.sql}</p>
 */
@Entity
@Table(name = "email_verification_tokens")
public class EmailVerificationToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Usuário dono do token. Cascade DELETE no banco: remover o usuário
     * (inclusive na purga de contas não verificadas) remove seus tokens.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    /** Valor do token (UUID v4 gerado em {@link com.ebbin.api.service.AuthService}). */
    @Column(nullable = false, unique = true, length = 36)
    private String token;

    /** Instante a partir do qual o token é considerado expirado. */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /** {@code true} quando o token já foi consumido em uma confirmação bem-sucedida. */
    @Column(nullable = false)
    private boolean used = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ---- Construtores ----

    public EmailVerificationToken() {}

    public EmailVerificationToken(User user, String token, LocalDateTime expiresAt) {
        this.user = user;
        this.token = token;
        this.expiresAt = expiresAt;
    }

    // ---- Getters & Setters ----

    public UUID getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getToken() { return token; }
    public void setToken(String token) { this.token = token; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public boolean isUsed() { return used; }
    public void setUsed(boolean used) { this.used = used; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
