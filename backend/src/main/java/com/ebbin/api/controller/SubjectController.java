package com.ebbin.api.controller;

import com.ebbin.api.dto.SubjectDto;
import com.ebbin.api.service.SubjectService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/subjects")
@Validated
public class SubjectController {

    private static final Logger log = LoggerFactory.getLogger(SubjectController.class);

    /** Limite de subjects por sincronização — proteção contra DoS */
    private static final int MAX_SYNC_SIZE = 500;

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
     * Sincronização de subjects: o frontend envia uma lista e o backend faz upsert de cada item.
     * <p>
     * Por padrão é <b>não-destrutivo</b> — subjects existentes ausentes da lista são preservados.
     * Para o comportamento antigo (remover ausentes), passar {@code ?destructive=true}.
     * O padrão seguro evita "ressurreição" e perdas acidentais quando clientes
     * desatualizados reenviam uma lista incompleta.
     * <p>
     * Limite de {@value #MAX_SYNC_SIZE} itens para evitar abuso (DoS).
     */
    @PostMapping("/sync")
    public ResponseEntity<List<SubjectDto>> sync(
            @AuthenticationPrincipal UserDetails user,
            @RequestParam(name = "destructive", defaultValue = "false") boolean destructive,
            @Valid @Size(max = MAX_SYNC_SIZE, message = "Número máximo de subjects excedido")
            @RequestBody List<SubjectDto> subjects) {
        log.info("POST /api/subjects/sync — user={}, count={}, destructive={}",
                user.getUsername(), subjects.size(), destructive);
        return ResponseEntity.ok(subjectService.syncSubjects(user.getUsername(), subjects, destructive));
    }

    /** Upsert de um subject individual (usado para atualizações incrementais) */
    @PutMapping("/{id}")
    public ResponseEntity<SubjectDto> upsert(
            @AuthenticationPrincipal UserDetails user,
            @PathVariable String id,
            @Valid @RequestBody SubjectDto dto) {
        log.debug("PUT /api/subjects/{} — user={}", id, user.getUsername());
        if (!id.equals(dto.id())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "O id do path (%s) não corresponde ao id do corpo (%s)".formatted(id, dto.id()));
        }
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
