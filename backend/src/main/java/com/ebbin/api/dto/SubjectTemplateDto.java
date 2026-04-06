package com.ebbin.api.dto;

import com.ebbin.api.model.SubjectTemplate;

public record SubjectTemplateDto(
        Long id,
        String area,
        String disciplina,
        String assunto,
        String relevancia
) {
    public static SubjectTemplateDto from(SubjectTemplate t) {
        return new SubjectTemplateDto(t.getId(), t.getArea(), t.getDisciplina(), t.getAssunto(), t.getRelevancia());
    }
}
