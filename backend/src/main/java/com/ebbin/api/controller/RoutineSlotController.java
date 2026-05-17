package com.ebbin.api.controller;

import com.ebbin.api.dto.RoutineSlotDto;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.RoutineSlotService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/routine")
public class RoutineSlotController {

    private static final Logger log = LoggerFactory.getLogger(RoutineSlotController.class);

    private final RoutineSlotService routineService;
    private final UserRepository userRepository;

    public RoutineSlotController(RoutineSlotService routineService, UserRepository userRepository) {
        this.routineService = routineService;
        this.userRepository = userRepository;
    }

    /** Retorna a rotina do usuário autenticado. */
    @GetMapping
    public ResponseEntity<List<RoutineSlotDto>> list(@AuthenticationPrincipal UserDetails principal) {
        log.debug("GET /api/routine — user={}", principal.getUsername());
        User user = findUser(principal.getUsername());
        return ResponseEntity.ok(routineService.listForUser(user.getId()));
    }

    /**
     * Substitui o conjunto inteiro da rotina do usuário (PUT idempotente). Upsert
     * por {@code clientId}; slots ausentes do payload são removidos.
     */
    @PutMapping
    public ResponseEntity<List<RoutineSlotDto>> replaceAll(@AuthenticationPrincipal UserDetails principal,
                                                           @RequestBody List<RoutineSlotDto> slots) {
        log.info("PUT /api/routine — user={}, count={}", principal.getUsername(),
                slots == null ? null : slots.size());
        User user = findUser(principal.getUsername());
        return ResponseEntity.ok(routineService.replaceAll(user.getId(), slots));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }
}
