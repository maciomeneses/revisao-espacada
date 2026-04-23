package com.ebbin.api.controller;

import com.ebbin.api.dto.DisciplineDto;
import com.ebbin.api.service.DisciplineService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/disciplines")
@Validated
public class DisciplineController {

    private static final Logger log = LoggerFactory.getLogger(DisciplineController.class);

    private final DisciplineService disciplineService;

    public DisciplineController(DisciplineService disciplineService) {
        this.disciplineService = disciplineService;
    }

    /**
     * Lista disciplinas do usuário. Se {@code areaId} for informado, restringe à área.
     */
    @GetMapping
    public ResponseEntity<List<DisciplineDto>> list(@AuthenticationPrincipal UserDetails user,
                                                    @RequestParam(required = false) Long areaId) {
        log.debug("GET /api/disciplines — user={}, areaId={}", user.getUsername(), areaId);
        List<DisciplineDto> result = areaId == null
                ? disciplineService.getDisciplines(user.getUsername())
                : disciplineService.getDisciplinesByArea(user.getUsername(), areaId);
        return ResponseEntity.ok(result);
    }

    @PostMapping
    public ResponseEntity<DisciplineDto> create(@AuthenticationPrincipal UserDetails user,
                                                @Valid @RequestBody CreateRequest body) {
        log.info("POST /api/disciplines — user={}, areaId={}, name={}",
                user.getUsername(), body.areaId(), body.name());
        DisciplineDto created = disciplineService.createDiscipline(
                user.getUsername(), body.areaId(), body.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<DisciplineDto> rename(@AuthenticationPrincipal UserDetails user,
                                                @PathVariable Long id,
                                                @Valid @RequestBody NameRequest body) {
        log.info("PUT /api/disciplines/{} — user={}, name={}", id, user.getUsername(), body.name());
        return ResponseEntity.ok(disciplineService.renameDiscipline(
                user.getUsername(), id, body.name()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails user,
                                       @PathVariable Long id) {
        log.info("DELETE /api/disciplines/{} — user={}", id, user.getUsername());
        disciplineService.deleteDiscipline(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    public record CreateRequest(
        @NotNull Long areaId,
        @NotBlank @Size(max = 120) String name
    ) {}

    public record NameRequest(@NotBlank @Size(max = 120) String name) {}
}
