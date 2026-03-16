package com.ebbin.api.controller;

import com.ebbin.api.dto.SubjectDto;
import com.ebbin.api.service.SubjectService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@Validated
public class SubjectController {

    private static final Logger log = LoggerFactory.getLogger(SubjectController.class);

    /** Limite de subjects por sincronização — proteção contra DoS */
    private static final int MAX_SYNC_SIZE = 2000;

    private final SubjectService subjectService;

    public SubjectController(SubjectService subjectService) {
        this.subjectService = subjectService;
    }

    /** Retorna todos os subjects do usuário autenticado */
    @GetMapping
    public ResponseEntity<List<SubjectDto>> list(@AuthenticationPrincipal UserDetails user) {
        log.debug("GET /api/subjects — user={}", user.getUsername());
        return ResponseEntity.ok(subjectService.getSubjects(user.getUsername()));
    }

    /**
     * Sincronização completa: o frontend envia o estado atual de todos os subjects.
     * O backend faz upsert de cada um e remove os que não estão mais presentes.
     * Limite de {@value #MAX_SYNC_SIZE} itens para evitar abuso (DoS).
     */
    @PostMapping("/sync")
    public ResponseEntity<List<SubjectDto>> sync(
            @AuthenticationPrincipal UserDetails user,
            @Valid @Size(max = MAX_SYNC_SIZE, message = "Número máximo de subjects excedido")
            @RequestBody List<SubjectDto> subjects) {
        log.info("POST /api/subjects/sync — user={}, count={}", user.getUsername(), subjects.size());
        return ResponseEntity.ok(subjectService.syncSubjects(user.getUsername(), subjects));
    }

    /** Upsert de um subject individual (usado para atualizações incrementais) */
    @PutMapping("/{id}")
    public ResponseEntity<SubjectDto> upsert(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id,
            @Valid @RequestBody SubjectDto dto) {
        log.debug("PUT /api/subjects/{} — user={}", id, user.getUsername());
        return ResponseEntity.ok(subjectService.upsertSubject(user.getUsername(), dto));
    }

    /** Remove um subject */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id) {
        log.info("DELETE /api/subjects/{} — user={}", id, user.getUsername());
        subjectService.deleteSubject(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }
}
