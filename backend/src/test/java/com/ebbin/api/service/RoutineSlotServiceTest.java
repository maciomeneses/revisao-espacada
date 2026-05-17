package com.ebbin.api.service;

import com.ebbin.api.dto.RoutineSlotDto;
import com.ebbin.api.model.RoutineSlot;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.RoutineSlotRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyCollection;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoutineSlotService — rotina semanal")
class RoutineSlotServiceTest {

    @Mock RoutineSlotRepository repository;
    @Mock UserRepository userRepository;
    @InjectMocks RoutineSlotService service;

    private User user;
    private UUID userId;

    @BeforeEach
    void setUp() {
        userId = UUID.randomUUID();
        user = new User();
        user.setId(userId);
        user.setEmail("user@test.com");
        user.setRole(User.Role.USER);
    }

    private RoutineSlotDto dto(String id, int day, String type, String area, String title) {
        return new RoutineSlotDto(id, day, title, "08:00", "09:00", type, area);
    }

    @Test
    @DisplayName("listForUser mapeia entidades para DTOs")
    void listForUser_mapsEntities() {
        RoutineSlot slot = new RoutineSlot();
        slot.setId(UUID.randomUUID());
        slot.setUser(user);
        slot.setClientId("c1");
        slot.setDayOfWeek((short) 2);
        slot.setSlotType("study");
        slot.setArea("Matemática");
        slot.setTitle("Mat");
        slot.setStartTime("08:00");
        slot.setEndTime("09:00");
        when(repository.findAllByUser_Id(userId)).thenReturn(List.of(slot));

        List<RoutineSlotDto> result = service.listForUser(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo("c1");
        assertThat(result.get(0).dayOfWeek()).isEqualTo(2);
        assertThat(result.get(0).type()).isEqualTo("study");
        assertThat(result.get(0).area()).isEqualTo("Matemática");
        assertThat(result.get(0).title()).isEqualTo("Mat");
    }

    @Test
    @DisplayName("listForUser com slot sem dayOfWeek expõe null")
    void listForUser_nullDayOfWeek() {
        RoutineSlot slot = new RoutineSlot();
        slot.setId(UUID.randomUUID());
        slot.setUser(user);
        slot.setClientId("c1");
        slot.setSlotType("other");
        when(repository.findAllByUser_Id(userId)).thenReturn(List.of(slot));

        List<RoutineSlotDto> result = service.listForUser(userId);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).dayOfWeek()).isNull();
    }

    @Test
    @DisplayName("replaceAll insere slots novos e atualiza existentes")
    void replaceAll_upsertsAndUpdates() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        RoutineSlot existing = new RoutineSlot();
        existing.setId(UUID.randomUUID());
        existing.setUser(user);
        existing.setClientId("c1");
        existing.setDayOfWeek((short) 1);
        existing.setSlotType("study");
        when(repository.findByUser_IdAndClientId(userId, "c1")).thenReturn(Optional.of(existing));
        when(repository.findByUser_IdAndClientId(userId, "c2")).thenReturn(Optional.empty());
        when(repository.save(any(RoutineSlot.class))).thenAnswer(inv -> inv.getArgument(0));

        List<RoutineSlotDto> payload = List.of(
                dto("c1", 2, "study", "Matemática", "Mat"),
                dto("c2", 3, "other", null, "Academia")
        );

        List<RoutineSlotDto> result = service.replaceAll(userId, payload);

        assertThat(result).hasSize(2);
        verify(repository).deleteByUserIdAndClientIdNotIn(eq(userId), anyCollection());
        ArgumentCaptor<RoutineSlot> captor = ArgumentCaptor.forClass(RoutineSlot.class);
        verify(repository, times(2)).save(captor.capture());
        List<RoutineSlot> saved = captor.getAllValues();
        assertThat(saved).extracting(RoutineSlot::getClientId).containsExactlyInAnyOrder("c1", "c2");
        RoutineSlot c1 = saved.stream().filter(s -> "c1".equals(s.getClientId())).findFirst().orElseThrow();
        assertThat(c1.getDayOfWeek()).isEqualTo((short) 2);
        assertThat(c1.getSlotType()).isEqualTo("study");
        assertThat(c1.getArea()).isEqualTo("Matemática");
    }

    @Test
    @DisplayName("replaceAll com lista vazia apaga tudo")
    void replaceAll_emptyList_deletesAll() {
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        List<RoutineSlotDto> result = service.replaceAll(userId, List.of());

        assertThat(result).isEmpty();
        verify(repository).deleteAllByUserId(userId);
        verify(repository, never()).save(any());
    }

    @Test
    @DisplayName("replaceAll com payload nulo lança BAD_REQUEST")
    void replaceAll_nullPayload_badRequest() {
        assertThatThrownBy(() -> service.replaceAll(userId, null))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("obrigatório");
    }

    @Test
    @DisplayName("replaceAll acima do limite lança BAD_REQUEST")
    void replaceAll_tooManySlots_badRequest() {
        List<RoutineSlotDto> tooMany = new ArrayList<>();
        for (int i = 0; i <= RoutineSlotService.MAX_SLOTS; i++) {
            tooMany.add(dto("c" + i, 1, "study", "X", "T"));
        }
        assertThatThrownBy(() -> service.replaceAll(userId, tooMany))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("máximo");
    }

    @Test
    @DisplayName("replaceAll com slot nulo lança BAD_REQUEST")
    void replaceAll_nullSlot_badRequest() {
        List<RoutineSlotDto> payload = new ArrayList<>();
        payload.add(null);
        assertThatThrownBy(() -> service.replaceAll(userId, payload))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("replaceAll com id em branco lança BAD_REQUEST")
    void replaceAll_blankId_badRequest() {
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(dto("  ", 1, "study", "A", "T"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("clientId");
    }

    @Test
    @DisplayName("replaceAll com id null lança BAD_REQUEST")
    void replaceAll_nullId_badRequest() {
        RoutineSlotDto withNullId = new RoutineSlotDto(null, 1, "T", "08:00", "09:00", "study", "A");
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(withNullId)))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("replaceAll com id muito longo lança BAD_REQUEST")
    void replaceAll_idTooLong_badRequest() {
        String longId = "x".repeat(65);
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(dto(longId, 1, "study", "A", "T"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("64");
    }

    @Test
    @DisplayName("replaceAll com id duplicado lança BAD_REQUEST")
    void replaceAll_duplicateId_badRequest() {
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(
                dto("dup", 1, "study", "A", "T1"),
                dto("dup", 2, "study", "B", "T2")
        )))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("duplicado");
    }

    @Test
    @DisplayName("replaceAll com dayOfWeek=7 lança BAD_REQUEST")
    void replaceAll_invalidDay_badRequest() {
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(dto("c1", 7, "study", "A", "T"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("dayOfWeek");
    }

    @Test
    @DisplayName("replaceAll com dayOfWeek=-1 lança BAD_REQUEST")
    void replaceAll_negativeDay_badRequest() {
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(dto("c1", -1, "study", "A", "T"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("dayOfWeek");
    }

    @Test
    @DisplayName("replaceAll com dayOfWeek null lança BAD_REQUEST")
    void replaceAll_nullDay_badRequest() {
        RoutineSlotDto bad = new RoutineSlotDto("c1", null, "T", "08:00", "09:00", "study", "A");
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(bad)))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("dayOfWeek");
    }

    @Test
    @DisplayName("replaceAll com type inválido lança BAD_REQUEST")
    void replaceAll_invalidType_badRequest() {
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(dto("c1", 1, "exercise", "A", "T"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("type");
    }

    @Test
    @DisplayName("replaceAll com type null lança BAD_REQUEST")
    void replaceAll_nullType_badRequest() {
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(dto("c1", 1, null, "A", "T"))))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("type");
    }

    @Test
    @DisplayName("replaceAll para usuário inexistente lança UsernameNotFound")
    void replaceAll_userNotFound() {
        when(userRepository.findById(userId)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.replaceAll(userId, List.of(dto("c1", 1, "study", "A", "T"))))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
