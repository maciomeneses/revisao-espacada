package com.ebbin.api.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Slot da rotina semanal do estudante. Cada slot representa um intervalo
 * recorrente em um dia da semana (0 = domingo, 6 = sábado) em que o usuário
 * estuda determinada área ou faz outra atividade.
 *
 * <p>Identidade dupla:
 * <ul>
 *   <li>{@code id} (UUID) — PK gerada no backend.</li>
 *   <li>{@code clientId} — id curto gerado no frontend; é estável para o
 *       cliente e permite operações de upsert idempotentes pelo PUT em massa
 *       de {@code /api/routine}. UNIQUE por (user_id, client_id).</li>
 * </ul>
 *
 * <p>FK com ON DELETE CASCADE: ao remover o usuário, sua rotina inteira é
 * automaticamente excluída.
 */
@Entity
@Table(name = "routine_slot", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "client_id"})
})
public class RoutineSlot {

    @Id
    @Column(name = "id", nullable = false, updatable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "client_id", nullable = false, length = 64)
    private String clientId;

    @Column(name = "day_of_week", nullable = false)
    private Short dayOfWeek;

    /** "study" ou "other". */
    @Column(name = "slot_type", nullable = false, length = 16)
    private String slotType;

    @Column(name = "area", length = 128)
    private String area;

    @Column(name = "title", length = 255)
    private String title;

    @Column(name = "start_time", length = 8)
    private String startTime;

    @Column(name = "end_time", length = 8)
    private String endTime;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public UUID getId() { return id; }
    public void setId(UUID id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }

    public Short getDayOfWeek() { return dayOfWeek; }
    public void setDayOfWeek(Short dayOfWeek) { this.dayOfWeek = dayOfWeek; }

    public String getSlotType() { return slotType; }
    public void setSlotType(String slotType) { this.slotType = slotType; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getStartTime() { return startTime; }
    public void setStartTime(String startTime) { this.startTime = startTime; }

    public String getEndTime() { return endTime; }
    public void setEndTime(String endTime) { this.endTime = endTime; }

    public OffsetDateTime getCreatedAt() { return createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
}
