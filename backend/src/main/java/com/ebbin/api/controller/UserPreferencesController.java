package com.ebbin.api.controller;

import com.ebbin.api.dto.UserPreferencesDto;
import com.ebbin.api.model.User;
import com.ebbin.api.model.UserPreferences;
import com.ebbin.api.repository.UserRepository;
import com.ebbin.api.service.UserPreferencesService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.Set;

@RestController
@RequestMapping("/api/preferences")
public class UserPreferencesController {

    private static final Logger log = LoggerFactory.getLogger(UserPreferencesController.class);

    private final UserPreferencesService preferencesService;
    private final UserRepository userRepository;

    public UserPreferencesController(UserPreferencesService preferencesService,
                                     UserRepository userRepository) {
        this.preferencesService = preferencesService;
        this.userRepository = userRepository;
    }

    /** Retorna as preferências do usuário autenticado, criando defaults se necessário. */
    @GetMapping
    public ResponseEntity<UserPreferencesDto> get(@AuthenticationPrincipal UserDetails principal) {
        log.debug("GET /api/preferences — user={}", principal.getUsername());
        User user = findUser(principal.getUsername());
        UserPreferences prefs = preferencesService.findOrCreate(user.getId());
        return ResponseEntity.ok(UserPreferencesDto.from(prefs));
    }

    /** Atualiza as preferências do usuário autenticado. */
    @PutMapping
    public ResponseEntity<UserPreferencesDto> update(@AuthenticationPrincipal UserDetails principal,
                                                     @RequestBody UserPreferencesDto dto) {
        log.debug("PUT /api/preferences — user={}, days={}, maxPerDay={}", principal.getUsername(),
                dto == null ? null : dto.allowedReviewDays(),
                dto == null ? null : dto.maxReviewsPerDay());
        if (dto == null || dto.allowedReviewDays() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "allowedReviewDays é obrigatório");
        }
        Set<Short> days = new HashSet<>();
        for (Integer d : dto.allowedReviewDays()) {
            if (d == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "allowedReviewDays não pode conter valores nulos");
            }
            days.add(d.shortValue());
        }
        User user = findUser(principal.getUsername());
        UserPreferences prefs = preferencesService.update(user.getId(), days, dto.maxReviewsPerDay());
        return ResponseEntity.ok(UserPreferencesDto.from(prefs));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }
}
