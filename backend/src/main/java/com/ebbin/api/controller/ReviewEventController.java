package com.ebbin.api.controller;

import com.ebbin.api.dto.ReviewEventDto;
import com.ebbin.api.service.ReviewEventService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/review-events")
public class ReviewEventController {

    private static final Logger log = LoggerFactory.getLogger(ReviewEventController.class);

    private final ReviewEventService reviewEventService;

    public ReviewEventController(ReviewEventService reviewEventService) {
        this.reviewEventService = reviewEventService;
    }

    /** Retorna todo o histórico de revisões do usuário autenticado. */
    @GetMapping
    public ResponseEntity<List<ReviewEventDto>> list(@AuthenticationPrincipal UserDetails user) {
        log.debug("GET /api/review-events — user={}", user.getUsername());
        return ResponseEntity.ok(reviewEventService.getEvents(user.getUsername()));
    }

    /** Registra uma revisão concluída. */
    @PostMapping
    public ResponseEntity<ReviewEventDto> create(
            @AuthenticationPrincipal UserDetails user,
            @Valid @RequestBody ReviewEventDto dto) {
        log.debug("POST /api/review-events — user={}, subject={}", user.getUsername(), dto.subjectId());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewEventService.logEvent(user.getUsername(), dto));
    }
}
