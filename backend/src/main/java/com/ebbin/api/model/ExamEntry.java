package com.ebbin.api.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Registro de uma prova ou simulado realizado pelo aluno.
 *
 * <p>Possui FK para {@code users} com CASCADE DELETE: ao remover o usuário,
 * todas as suas provas são automaticamente excluídas.
 */
@Entity
@Table(name = "exam_entries")
public class ExamEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "exam_date", nullable = false)
    private LocalDate examDate;

    @Column(name = "exam_name", nullable = false, length = 255)
    private String examName;

    /** Tipo da prova: "Prova na íntegra", "Simulado", etc. Opcional. */
    @Column(name = "exam_type", length = 100)
    private String examType;

    /** Percentual de acerto (0–100). */
    @Column(name = "score_percent", nullable = false, columnDefinition = "SMALLINT NOT NULL DEFAULT 0")
    private int scorePercent = 0;

    /** Anotações livres do aluno — Caderno de erros. Sem limite de tamanho. */
    @Column(columnDefinition = "TEXT")
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public LocalDate getExamDate() { return examDate; }
    public void setExamDate(LocalDate examDate) { this.examDate = examDate; }

    public String getExamName() { return examName; }
    public void setExamName(String examName) { this.examName = examName; }

    public String getExamType() { return examType; }
    public void setExamType(String examType) { this.examType = examType; }

    public int getScorePercent() { return scorePercent; }
    public void setScorePercent(int scorePercent) { this.scorePercent = scorePercent; }

    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
