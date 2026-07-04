package com.ebbin.api.service;

import com.ebbin.api.model.User;
import com.ebbin.api.model.UserPreferences;
import com.ebbin.api.repository.UserPreferencesRepository;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;
import java.util.UUID;

@Service
public class UserPreferencesService {

    private static final Logger log = LoggerFactory.getLogger(UserPreferencesService.class);

    private static final Short[] DEFAULT_DAYS = { 0, 1, 2, 3, 4, 5, 6 };

    private final UserPreferencesRepository repository;
    private final UserRepository userRepository;

    public UserPreferencesService(UserPreferencesRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    /** Retorna as preferências do usuário, criando-as com defaults se ainda não existirem. */
    @Transactional
    public UserPreferences findOrCreate(UUID userId) {
        return repository.findById(userId).orElseGet(() -> createDefault(userId));
    }

    /**
     * Atualiza as preferências de revisão (substituição completa do recurso).
     * Valida dias 0..6 e conjunto não vazio; {@code maxReviewsPerDay} deve ser
     * {@code null} (sem limite) ou estar em 1..{@value Short#MAX_VALUE}.
     */
    @Transactional
    public UserPreferences update(UUID userId, Set<Short> allowedDays, Integer maxReviewsPerDay) {
        if (allowedDays == null || allowedDays.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "allowedReviewDays não pode ser vazio");
        }
        for (Short day : allowedDays) {
            if (day == null || day < 0 || day > 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Dia inválido em allowedReviewDays: " + day + " (esperado 0..6)");
            }
        }
        if (maxReviewsPerDay != null && (maxReviewsPerDay < 1 || maxReviewsPerDay > Short.MAX_VALUE)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "maxReviewsPerDay inválido: " + maxReviewsPerDay + " (esperado null ou >= 1)");
        }
        UserPreferences prefs = repository.findById(userId).orElseGet(() -> createDefault(userId));
        prefs.setAllowedReviewDays(allowedDays.stream().sorted().toArray(Short[]::new));
        prefs.setMaxReviewsPerDay(maxReviewsPerDay == null ? null : maxReviewsPerDay.shortValue());
        UserPreferences saved = repository.save(prefs);
        log.debug("update preferences: userId={}, days={}, maxPerDay={}", userId, allowedDays, maxReviewsPerDay);
        return saved;
    }

    private UserPreferences createDefault(UUID userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + userId));
        UserPreferences prefs = new UserPreferences();
        prefs.setUser(user);
        prefs.setAllowedReviewDays(DEFAULT_DAYS.clone());
        UserPreferences saved = repository.save(prefs);
        log.debug("created default preferences for userId={}", userId);
        return saved;
    }
}
