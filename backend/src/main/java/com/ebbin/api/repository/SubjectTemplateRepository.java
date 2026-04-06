package com.ebbin.api.repository;

import com.ebbin.api.model.SubjectTemplate;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface SubjectTemplateRepository extends JpaRepository<SubjectTemplate, Long> {

    List<SubjectTemplate> findAllByOrderByAssuntoAsc();

    List<SubjectTemplate> findByDisciplinaIgnoreCaseOrderByAssuntoAsc(String disciplina);
}
