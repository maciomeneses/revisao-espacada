package com.ebbin.api.service;

import com.ebbin.api.dto.RoutineSlotDto;
import com.ebbin.api.model.RoutineSlot;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.RoutineSlotRepository;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class RoutineSlotService {

    private static final Logger log = LoggerFactory.getLogger(RoutineSlotService.class);

    /** Tamanho máximo da rotina (defesa contra DoS / payloads abusivos). */
    static final int MAX_SLOTS = 200;

    private static final Set<String> VALID_TYPES = Set.of("study", "other");

    private final RoutineSlotRepository repository;
    private final UserRepository userRepository;

    public RoutineSlotService(RoutineSlotRepository repository, UserRepository userRepository) {
        this.repository = repository;
        this.userRepository = userRepository;
    }

    /** Lista os slots de rotina do usuário (ordem indefinida — frontend ordena). */
    @Transactional(readOnly = true)
    public List<RoutineSlotDto> listForUser(UUID userId) {
        return repository.findAllByUser_Id(userId).stream()
                .map(RoutineSlotDto::from)
                .toList();
    }

    /**
     * Substitui (PUT idempotente) o conjunto inteiro de slots do usuário:
     * upserta cada item por {@code clientId} e remove do banco os que não
     * estiverem mais presentes.
     */
    @Transactional
    public List<RoutineSlotDto> replaceAll(UUID userId, List<RoutineSlotDto> slots) {
        if (slots == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Corpo da rotina é obrigatório");
        }
        if (slots.size() > MAX_SLOTS) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Rotina excede o número máximo de slots (" + MAX_SLOTS + ")");
        }
        validateAll(slots);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + userId));

        Set<String> incomingIds = new HashSet<>();
        for (RoutineSlotDto dto : slots) {
            incomingIds.add(dto.id());
        }

        // Remove os que não vieram no payload — se vazio, limpa tudo.
        if (incomingIds.isEmpty()) {
            repository.deleteAllByUserId(userId);
        } else {
            repository.deleteByUserIdAndClientIdNotIn(userId, incomingIds);
        }

        List<RoutineSlot> saved = new ArrayList<>(slots.size());
        for (RoutineSlotDto dto : slots) {
            RoutineSlot entity = repository.findByUser_IdAndClientId(userId, dto.id())
                    .orElseGet(() -> {
                        RoutineSlot fresh = new RoutineSlot();
                        fresh.setId(UUID.randomUUID());
                        fresh.setUser(user);
                        fresh.setClientId(dto.id());
                        return fresh;
                    });
            entity.setDayOfWeek(dto.dayOfWeek().shortValue());
            entity.setSlotType(dto.type());
            entity.setArea(dto.area());
            entity.setTitle(dto.title());
            entity.setStartTime(dto.startTime());
            entity.setEndTime(dto.endTime());
            saved.add(repository.save(entity));
        }
        log.debug("replaceAll routine: userId={}, count={}", userId, saved.size());
        return saved.stream().map(RoutineSlotDto::from).toList();
    }

    private void validateAll(List<RoutineSlotDto> slots) {
        Set<String> seen = new HashSet<>();
        for (RoutineSlotDto dto : slots) {
            if (dto == null) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Slot nulo não é permitido");
            }
            if (dto.id() == null || dto.id().isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Slot sem id (clientId)");
            }
            if (dto.id().length() > 64) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "id do slot excede 64 caracteres");
            }
            if (!seen.add(dto.id())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "id duplicado no payload: " + dto.id());
            }
            if (dto.dayOfWeek() == null || dto.dayOfWeek() < 0 || dto.dayOfWeek() > 6) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "dayOfWeek inválido: " + dto.dayOfWeek() + " (esperado 0..6)");
            }
            if (dto.type() == null || !VALID_TYPES.contains(dto.type())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "type inválido: " + dto.type() + " (esperado 'study' ou 'other')");
            }
        }
    }
}
