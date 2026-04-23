package com.ebbin.api.controller;

import com.ebbin.api.dto.AreaDto;
import com.ebbin.api.service.AreaService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
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

/**
 * CRUD de áreas de estudo do usuário autenticado.
 * Erros mapeados para ProblemDetail via {@code GlobalExceptionHandler} (RFC 9457).
 */
@RestController
@RequestMapping("/api/areas")
@Validated
public class AreaController {

    private static final Logger log = LoggerFactory.getLogger(AreaController.class);

    private final AreaService areaService;

    public AreaController(AreaService areaService) {
        this.areaService = areaService;
    }

    @GetMapping
    public ResponseEntity<List<AreaDto>> list(@AuthenticationPrincipal UserDetails user) {
        log.debug("GET /api/areas — user={}", user.getUsername());
        return ResponseEntity.ok(areaService.getAreas(user.getUsername()));
    }

    @PostMapping
    public ResponseEntity<AreaDto> create(@AuthenticationPrincipal UserDetails user,
                                          @Valid @RequestBody NameRequest body) {
        log.info("POST /api/areas — user={}, name={}", user.getUsername(), body.name());
        AreaDto created = areaService.createArea(user.getUsername(), body.name());
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    public ResponseEntity<AreaDto> rename(@AuthenticationPrincipal UserDetails user,
                                          @PathVariable Long id,
                                          @Valid @RequestBody NameRequest body) {
        log.info("PUT /api/areas/{} — user={}, name={}", id, user.getUsername(), body.name());
        return ResponseEntity.ok(areaService.renameArea(user.getUsername(), id, body.name()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal UserDetails user,
                                       @PathVariable Long id) {
        log.info("DELETE /api/areas/{} — user={}", id, user.getUsername());
        areaService.deleteArea(user.getUsername(), id);
        return ResponseEntity.noContent().build();
    }

    /** Payload de create/rename — só o nome. */
    public record NameRequest(@NotBlank @Size(max = 120) String name) {}
}
