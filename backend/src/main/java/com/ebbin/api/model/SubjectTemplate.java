package com.ebbin.api.model;

import jakarta.persistence.*;

/**
 * Assunto pré-cadastrado pela plataforma, disponível para todos os usuários
 * selecionarem ao registrar um estudo.
 *
 * <p>Não possui FK de usuário — os templates são globais e gerenciados pelo admin.
 */
@Entity
@Table(name = "subject_templates")
public class SubjectTemplate {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String area;

    @Column(nullable = false, length = 100)
    private String disciplina;

    @Column(nullable = false, length = 255)
    private String assunto;

    @Column(nullable = false, length = 20)
    private String relevancia = "Alta";

    public Long getId() { return id; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getDisciplina() { return disciplina; }
    public void setDisciplina(String disciplina) { this.disciplina = disciplina; }

    public String getAssunto() { return assunto; }
    public void setAssunto(String assunto) { this.assunto = assunto; }

    public String getRelevancia() { return relevancia; }
    public void setRelevancia(String relevancia) { this.relevancia = relevancia; }
}
