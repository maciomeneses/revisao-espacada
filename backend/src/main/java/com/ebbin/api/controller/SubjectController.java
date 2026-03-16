package com.ebbin.api.controller;

import com.ebbin.api.dto.SubjectDto;
import com.ebbin.api.service.SubjectService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
public class SubjectController {

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    /** Retorna todos os subjects do usuário autenticado */
    @GetMapping
    public ResponseEntity<List<SubjectDto>> list(@AuthenticationPrincipal UserDetails user) {
        return ResponseEntity.ok(subjectService.getSubjects(user.getUsername()));
    }

    /**
     * Sincronização completa: o frontend envia o estado atual de todos os subjects.
     * O backend faz upsert de cada um e remove os que não estão mais presentes.
     */
    @PostMapping("/sync")
    public ResponseEntity<List<SubjectDto>> sync(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody List<SubjectDto> subjects) {
        return ResponseEntity.ok(subjectService.syncSubjects(user.getUsername(), subjects));
    }

    /** Upsert de um subject individual (usado para atualizações incrementais) */
    @PutMapping("/{id}")
    public ResponseEntity<SubjectDto> upsert(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id,
            @Valid @RequestBody SubjectDto dto) {
        return ResponseEntity.ok(subjectService.upsertSubject(user.getUsername(), dto));
    }

    /** Remove um subject */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id) {
        subjectService.deleteSubject(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
