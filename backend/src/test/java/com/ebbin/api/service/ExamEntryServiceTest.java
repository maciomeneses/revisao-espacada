package com.ebbin.api.service;

import com.ebbin.api.dto.ExamEntryDto;
import com.ebbin.api.model.ExamEntry;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.ExamEntryRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ExamEntryService — CRUD de provas")
class ExamEntryServiceTest {

    @Mock ExamEntryRepository examEntryRepository;
    @Mock UserRepository userRepository;
    @InjectMocks ExamEntryService service;

    private User user;
    private ExamEntry entry;
    private ExamEntryDto dto;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@test.com");
        user.setRole(User.Role.USER);

        entry = new ExamEntry();
        entry.setUser(user);
        entry.setExamDate(LocalDate.of(2026, 4, 1));
        entry.setExamName("ENEM 2025");
        entry.setExamType("Prova na íntegra");
        entry.setScorePercent(72);
        entry.setNotes("Errei questões de termodinâmica.");

        dto = new ExamEntryDto(null, LocalDate.of(2026, 4, 1), "ENEM 2025",
                "Prova na íntegra", 72, "Errei questões de termodinâmica.", null);
    }

    @Test
    @DisplayName("list retorna provas do usuário em ordem decrescente de data")
    void list_returnsUserEntries() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(examEntryRepository.findByUserOrderByExamDateDesc(user)).thenReturn(List.of(entry));

        List<ExamEntryDto> result = service.list("user@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).examName()).isEqualTo("ENEM 2025");
    }

    @Test
    @DisplayName("list lança exceção para usuário inexistente")
    void list_userNotFound() {
        when(userRepository.findByEmail("x@x.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.list("x@x.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("create persiste e retorna a prova criada")
    void create_savesEntry() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(examEntryRepository.save(any(ExamEntry.class))).thenReturn(entry);

        ExamEntryDto result = service.create("user@test.com", dto);

        assertThat(result.examName()).isEqualTo("ENEM 2025");
        assertThat(result.scorePercent()).isEqualTo(72);
        verify(examEntryRepository).save(any(ExamEntry.class));
    }

    @Test
    @DisplayName("update altera os dados da prova existente")
    void update_modifiesEntry() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(examEntryRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(entry));
        when(examEntryRepository.save(any(ExamEntry.class))).thenReturn(entry);

        ExamEntryDto updated = new ExamEntryDto(1L, LocalDate.of(2026, 4, 1),
                "ENEM 2025 Atualizado", "Simulado", 80, "Notas atualizadas", null);
        ExamEntryDto result = service.update("user@test.com", 1L, updated);

        assertThat(result.examName()).isEqualTo("ENEM 2025 Atualizado");  // applyTo modifica entry in-place
        verify(examEntryRepository).save(entry);
    }

    @Test
    @DisplayName("update lança NOT_FOUND para prova de outro usuário")
    void update_notFound() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(examEntryRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.update("user@test.com", 99L, dto))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("delete remove a prova do usuário")
    void delete_removesEntry() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(examEntryRepository.findByIdAndUser(1L, user)).thenReturn(Optional.of(entry));

        service.delete("user@test.com", 1L);

        verify(examEntryRepository).delete(entry);
    }

    @Test
    @DisplayName("delete lança NOT_FOUND para prova inexistente")
    void delete_notFound() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(examEntryRepository.findByIdAndUser(99L, user)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.delete("user@test.com", 99L))
                .isInstanceOf(ResponseStatusException.class);
    }

    @Test
    @DisplayName("ExamEntryDto.from mapeia todos os campos")
    void dto_from_mapsAllFields() {
        ExamEntryDto result = ExamEntryDto.from(entry);

        assertThat(result.examName()).isEqualTo("ENEM 2025");
        assertThat(result.examType()).isEqualTo("Prova na íntegra");
        assertThat(result.scorePercent()).isEqualTo(72);
        assertThat(result.notes()).isEqualTo("Errei questões de termodinâmica.");
    }
}
