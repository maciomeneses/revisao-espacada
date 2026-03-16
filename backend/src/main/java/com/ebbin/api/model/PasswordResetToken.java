package com.ebbin.api.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Entidade que representa um token de reset de senha de uso único.
 *
 * <p>Cada token está vinculado a um {@link User}, possui um TTL (expiresAt) e um flag
 * {@code used} que é marcado como {@code true} assim que o reset é executado com sucesso.
 * Um token inválido é aquele que (a) não existe, (b) já foi utilizado, ou (c) está expirado.</p>
 *
 * <p>Mapeamento Flyway: {@code V3__password_reset_tokens.sql}</p>
 */
@Entity
@Table(name = "password_reset_tokens")
public class PasswordResetToken {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * Usuário proprietário do token. Cascade DELETE: remover o usuário invalida todos os seus tokens.
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * Valor do token (UUID v4 gerado em {@link com.ebbin.api.service.AuthService}).
     * Indexado e com constraint UNIQUE para lookup eficiente e seguro.
     */
    @Column(nullable = false, unique = true, length = 36)
    private String token;

    /**
     * Instante a partir do qual o token é considerado expirado.
     * Valor definido pelo serviço no momento da criação (agora + 15 minutos).
     */
    @Column(nullable = false)
    private LocalDateTime expiresAt;

    /**
     * {@code true} quando o token já foi consumido em um reset bem-sucedido.
     * Garante uso único mesmo que o token não tenha expirado ainda.
     */
    @Column(nullable = false)
    private boolean used = false;

    @CreationTimestamp
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    // ---- Construtores ----

    public PasswordResetToken() {}

    public PasswordResetToken(User user, String token, LocalDateTime expiresAt) {
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
