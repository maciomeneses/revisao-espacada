package com.ebbin.api.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Preferências do usuário relacionadas ao fluxo de revisão.
 *
 * <p>Armazena {@code allowedReviewDays} — conjunto dos dias da semana
 * (0 = domingo, 6 = sábado) em que o usuário deseja ser apresentado a
 * revisões — e {@code maxReviewsPerDay}, o teto de revisões agendáveis por dia
 * ({@code null} = sem limite). Outras preferências futuras (modo escuro,
 * notificações, etc.) podem ser adicionadas a esta mesma tabela.
 *
 * <p>FK 1:1 com {@code users} via {@code user_id} (PK compartilhada) com
 * CASCADE DELETE: ao remover o usuário, suas preferências são automaticamente
 * excluídas.
 */
@Entity
@Table(name = "user_preferences")
public class UserPreferences {

    @Id
    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @MapsId
    @JoinColumn(name = "user_id")
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    /**
     * Dias da semana (0 = domingo, 6 = sábado) permitidos para apresentação de
     * revisões. Armazenado como {@code SMALLINT[]} no PostgreSQL via
     * {@link SqlTypes#ARRAY}. Padrão: todos os dias da semana.
     */
    @JdbcTypeCode(SqlTypes.ARRAY)
    @Column(name = "allowed_review_days", nullable = false)
    private Short[] allowedReviewDays = new Short[] { 0, 1, 2, 3, 4, 5, 6 };

    /**
     * Máximo de revisões agendáveis num mesmo dia. {@code null} = sem limite
     * (comportamento padrão). Quando definido, deve ser ≥ 1 (CHECK no banco).
     */
    @Column(name = "max_reviews_per_day")
    private Short maxReviewsPerDay;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getUserId() { return userId; }
    public void setUserId(UUID userId) { this.userId = userId; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Short[] getAllowedReviewDays() { return allowedReviewDays; }
    public void setAllowedReviewDays(Short[] allowedReviewDays) { this.allowedReviewDays = allowedReviewDays; }

    public Short getMaxReviewsPerDay() { return maxReviewsPerDay; }
    public void setMaxReviewsPerDay(Short maxReviewsPerDay) { this.maxReviewsPerDay = maxReviewsPerDay; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
