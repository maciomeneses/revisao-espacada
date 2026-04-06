package com.ebbin.api.controller;

import com.ebbin.api.dto.SubjectTemplateDto;
import com.ebbin.api.service.SubjectTemplateService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subject-templates")
public class SubjectTemplateController {

    private final SubjectTemplateService templateService;

    public SubjectTemplateController(SubjectTemplateService templateService) {
        this.templateService = templateService;
    }

    /**
     * Retorna os assuntos pré-cadastrados.
     *
     * @param disciplina filtro opcional (ex: "Física"). Se omitido, retorna todos.
     */
    @GetMapping
    public ResponseEntity<List<SubjectTemplateDto>> list(
            @RequestParam(required = false) String disciplina) {
        List<SubjectTemplateDto> result = (disciplina != null && !disciplina.isBlank())
                ? templateService.listByDisciplina(disciplina)
                : templateService.listAll();
        return ResponseEntity.ok(result);
    }
}
