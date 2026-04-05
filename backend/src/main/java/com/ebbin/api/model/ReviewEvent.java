package com.ebbin.api.model;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.OnDelete;
import org.hibernate.annotations.OnDeleteAction;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Registro de uma revisão concluída.
 *
 * <p>Armazena o evento de revisão desacoplado do estado atual do {@link Subject},
 * permitindo reconstruir séries temporais de estudo (gráficos de evolução)
 * mesmo após atualizações nos campos FSRS do assunto.
 *
 * <p>Não há FK para {@code subjects} intencionalmente: o histórico deve sobreviver
 * à remoção de um assunto. O {@code subjectId} é o {@code client_id} do frontend
 * e {@code subjectName} é desnormalizado para exibição retroativa.
 */
@Entity
@Table(name = "review_events")
public class ReviewEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    @OnDelete(action = OnDeleteAction.CASCADE)
    private User user;

    @Column(name = "subject_id", nullable = false)
    private String subjectId;

    @Column(name = "subject_name", nullable = false)
    private String subjectName;

    @Column(name = "review_date", nullable = false)
    private LocalDate reviewDate;

    /** Desempenho registrado nesta revisão (ruim/medio/bom/excelente). */
    @Column(nullable = false)
    private String performance = PerformanceLevel.NAO_CLASSIFICADA.getValue();

    /** Contador de revisões do assunto após este evento (reps = 1 → primeira revisão). */
    @Column(nullable = false)
    private int reps = 1;

    /** Questões respondidas nesta sessão. */
    @Column(nullable = false)
    private int questions = 10;

    /** Percentual real de acertos (0–100). */
    @Column(nullable = false, columnDefinition = "SMALLINT NOT NULL DEFAULT 0")
    private int accuracy = 0;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime createdAt;

    public Long getId() { return id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public String getSubjectId() { return subjectId; }
    public void setSubjectId(String subjectId) { this.subjectId = subjectId; }

    public String getSubjectName() { return subjectName; }
    public void setSubjectName(String subjectName) { this.subjectName = subjectName; }

    public LocalDate getReviewDate() { return reviewDate; }
    public void setReviewDate(LocalDate reviewDate) { this.reviewDate = reviewDate; }

    public PerformanceLevel getPerformance() { return PerformanceLevel.fromValue(performance); }
    public void setPerformance(PerformanceLevel p) {
        this.performance = (p != null ? p : PerformanceLevel.NAO_CLASSIFICADA).getValue();
    }

    public int getReps() { return reps; }
    public void setReps(int reps) { this.reps = reps; }

    public int getQuestions() { return questions; }
    public void setQuestions(int questions) { this.questions = questions; }

    public int getAccuracy() { return accuracy; }
    public void setAccuracy(int accuracy) { this.accuracy = accuracy; }

    public LocalDateTime getCreatedAt() { return createdAt; }
}
