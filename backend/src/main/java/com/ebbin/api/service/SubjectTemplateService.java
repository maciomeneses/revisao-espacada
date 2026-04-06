package com.ebbin.api.service;

import com.ebbin.api.dto.SubjectTemplateDto;
import com.ebbin.api.repository.SubjectTemplateRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubjectTemplateService {

    private final SubjectTemplateRepository templateRepository;

    public SubjectTemplateService(SubjectTemplateRepository templateRepository) {
        this.templateRepository = templateRepository;
    }

    @Transactional(readOnly = true)
    public List<SubjectTemplateDto> listAll() {
        return templateRepository.findAllByOrderByAssuntoAsc().stream()
                .map(SubjectTemplateDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<SubjectTemplateDto> listByDisciplina(String disciplina) {
        return templateRepository.findByDisciplinaIgnoreCaseOrderByAssuntoAsc(disciplina).stream()
                .map(SubjectTemplateDto::from)
                .toList();
    }
}
