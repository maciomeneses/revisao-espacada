package com.ebbin.api.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "subjects", uniqueConstraints = {
    @UniqueConstraint(columnNames = {"user_id", "client_id"})
})
public class Subject {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** ID gerado no cliente (frontend) para sincronização */
    @Column(name = "client_id", nullable = false)
    private String clientId;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(nullable = false)
    private String modulo;

    @Column(nullable = false)
    private String area;

    @Column(nullable = false)
    private String aulaPrincipal;

    @Column(nullable = false)
    private String relevancia;

    // Progress flags
    private boolean aulaAssistida = false;
    private boolean preAulaFeita = false;
    private boolean flashcardsFeitos = false;

    // Stage completion flags
    private boolean fixacao24hFeita = false;
    private boolean estudoReversoFeito = false;
    private boolean rev7dFeita = false;
    private boolean rev30dFeita = false;
    private boolean rev60dFeita = false;
    private boolean rev90dFeita = false;

    // Scheduling
    @Column(nullable = false, name = "current_stage")
    private String currentStage = ReviewStage.AULA.getValue();

    private LocalDate nextReviewDate;
    private LocalDate lastReviewDate;

    /**
     * Desempenho registrado na última revisão.
     * Armazenado como STRING no banco (mesmo padrão de {@link PerformanceLevel}).
     * Nullable: null indica que ainda não houve revisão avaliada.
     */
    @Column(name = "last_performance")
    private String lastPerformance;

    @Column(nullable = false, name = "performance_level")
    private String performanceLevel = PerformanceLevel.NAO_CLASSIFICADA.getValue();

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

    // Getters & Setters
    public Long getId() { return id; }
    public String getClientId() { return clientId; }
    public void setClientId(String clientId) { this.clientId = clientId; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public String getModulo() { return modulo; }
    public void setModulo(String modulo) { this.modulo = modulo; }
    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }
    public String getAulaPrincipal() { return aulaPrincipal; }
    public void setAulaPrincipal(String aulaPrincipal) { this.aulaPrincipal = aulaPrincipal; }
    public String getRelevancia() { return relevancia; }
    public void setRelevancia(String relevancia) { this.relevancia = relevancia; }
    public boolean isAulaAssistida() { return aulaAssistida; }
    public void setAulaAssistida(boolean v) { this.aulaAssistida = v; }
    public boolean isPreAulaFeita() { return preAulaFeita; }
    public void setPreAulaFeita(boolean v) { this.preAulaFeita = v; }
    public boolean isFlashcardsFeitos() { return flashcardsFeitos; }
    public void setFlashcardsFeitos(boolean v) { this.flashcardsFeitos = v; }
    public boolean isFixacao24hFeita() { return fixacao24hFeita; }
    public void setFixacao24hFeita(boolean v) { this.fixacao24hFeita = v; }
    public boolean isEstudoReversoFeito() { return estudoReversoFeito; }
    public void setEstudoReversoFeito(boolean v) { this.estudoReversoFeito = v; }
    public boolean isRev7dFeita() { return rev7dFeita; }
    public void setRev7dFeita(boolean v) { this.rev7dFeita = v; }
    public boolean isRev30dFeita() { return rev30dFeita; }
    public void setRev30dFeita(boolean v) { this.rev30dFeita = v; }
    public boolean isRev60dFeita() { return rev60dFeita; }
    public void setRev60dFeita(boolean v) { this.rev60dFeita = v; }
    public boolean isRev90dFeita() { return rev90dFeita; }
    public void setRev90dFeita(boolean v) { this.rev90dFeita = v; }
    public ReviewStage getCurrentStage() { return ReviewStage.fromValue(currentStage); }
    public void setCurrentStage(ReviewStage v) { this.currentStage = v != null ? v.getValue() : null; }
    public LocalDate getNextReviewDate() { return nextReviewDate; }
    public void setNextReviewDate(LocalDate v) { this.nextReviewDate = v; }
    public LocalDate getLastReviewDate() { return lastReviewDate; }
    public void setLastReviewDate(LocalDate v) { this.lastReviewDate = v; }
    public PerformanceLevel getLastPerformance() { return lastPerformance == null ? null : PerformanceLevel.fromValue(lastPerformance); }
    public void setLastPerformance(PerformanceLevel v) { this.lastPerformance = v != null ? v.getValue() : null; }
    public PerformanceLevel getPerformanceLevel() { return PerformanceLevel.fromValue(performanceLevel); }
    public void setPerformanceLevel(PerformanceLevel v) { this.performanceLevel = v != null ? v.getValue() : null; }
    public LocalDateTime getCreatedAt() { return createdAt; }
    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
