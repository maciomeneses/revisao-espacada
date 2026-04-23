package com.ebbin.api.service;

import com.ebbin.api.dto.DisciplineDto;
import com.ebbin.api.model.Area;
import com.ebbin.api.model.Discipline;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
import com.ebbin.api.repository.DisciplineRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("DisciplineService — CRUD de disciplinas dentro de uma área")
class DisciplineServiceTest {

    @Mock DisciplineRepository disciplineRepository;
    @Mock AreaRepository areaRepository;
    @Mock UserRepository userRepository;

    @InjectMocks DisciplineService disciplineService;

    private User user;
    private Area area;
    private Discipline discipline;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@test.com");
        user.setRole(User.Role.USER);

        area = new Area();
        area.setUser(user);
        area.setName("Ciências da Natureza");

        discipline = new Discipline();
        discipline.setUser(user);
        discipline.setArea(area);
        discipline.setName("Biologia");
    }

    @Test
    @DisplayName("getDisciplines deve retornar lista mapeada em DisciplineDto")
    void getDisciplines_returnsList() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(disciplineRepository.findAllByUserOrderByNameAsc(user)).thenReturn(List.of(discipline));

        List<DisciplineDto> result = disciplineService.getDisciplines("user@test.com");

        assertThat(result).singleElement()
                .satisfies(d -> {
                    assertThat(d.name()).isEqualTo("Biologia");
                    assertThat(d.areaName()).isEqualTo("Ciências da Natureza");
                });
    }

    @Test
    @DisplayName("getDisciplinesByArea deve restringir à área informada")
    void getDisciplinesByArea_filtersByArea() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));
        when(disciplineRepository.findAllByUserAndAreaOrderByNameAsc(user, area))
                .thenReturn(List.of(discipline));

        List<DisciplineDto> result = disciplineService.getDisciplinesByArea("user@test.com", 1L);

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getDisciplinesByArea deve lançar UsernameNotFoundException para área inexistente")
    void getDisciplinesByArea_areaNotFound_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> disciplineService.getDisciplinesByArea("user@test.com", 99L))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("createDiscipline deve salvar quando nome é único na área")
    void createDiscipline_success() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));
        when(disciplineRepository.existsByUserAndAreaAndName(user, area, "Química")).thenReturn(false);
        when(disciplineRepository.save(any(Discipline.class))).thenAnswer(inv -> inv.getArgument(0));

        DisciplineDto result = disciplineService.createDiscipline("user@test.com", 1L, " Química ");

        assertThat(result.name()).isEqualTo("Química");
        verify(disciplineRepository).save(any(Discipline.class));
    }

    @Test
    @DisplayName("createDiscipline deve rejeitar nome duplicado na mesma área")
    void createDiscipline_duplicate_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));
        when(disciplineRepository.existsByUserAndAreaAndName(user, area, "Biologia")).thenReturn(true);

        assertThatThrownBy(() -> disciplineService.createDiscipline("user@test.com", 1L, "Biologia"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("já existe");
    }

    @Test
    @DisplayName("createDiscipline deve rejeitar nome vazio")
    void createDiscipline_blank_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));

        assertThatThrownBy(() -> disciplineService.createDiscipline("user@test.com", 1L, ""))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> disciplineService.createDiscipline("user@test.com", 1L, null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("createDiscipline deve rejeitar nome com mais de 120 caracteres")
    void createDiscipline_tooLong_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));
        String tooLong = "x".repeat(121);

        assertThatThrownBy(() -> disciplineService.createDiscipline("user@test.com", 1L, tooLong))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("120");
    }

    @Test
    @DisplayName("renameDiscipline deve propagar novo nome para subjects.modulo")
    void renameDiscipline_success_propagates() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(disciplineRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(discipline));
        when(disciplineRepository.existsByUserAndAreaAndNameAndIdNot(user, area, "Bio", 1L)).thenReturn(false);
        when(disciplineRepository.save(any(Discipline.class))).thenAnswer(inv -> inv.getArgument(0));
        when(disciplineRepository.renameSubjectsModulo(user, "Ciências da Natureza", "Biologia", "Bio"))
                .thenReturn(5);

        DisciplineDto result = disciplineService.renameDiscipline("user@test.com", 1L, "Bio");

        assertThat(result.name()).isEqualTo("Bio");
        verify(disciplineRepository).renameSubjectsModulo(
                user, "Ciências da Natureza", "Biologia", "Bio");
    }

    @Test
    @DisplayName("renameDiscipline com mesmo nome deve ser no-op")
    void renameDiscipline_sameName_noop() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(disciplineRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(discipline));

        DisciplineDto result = disciplineService.renameDiscipline("user@test.com", 1L, "Biologia");

        assertThat(result.name()).isEqualTo("Biologia");
        verify(disciplineRepository, never()).save(any());
    }

    @Test
    @DisplayName("renameDiscipline deve rejeitar novo nome se já existe na mesma área")
    void renameDiscipline_duplicate_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(disciplineRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(discipline));
        when(disciplineRepository.existsByUserAndAreaAndNameAndIdNot(user, area, "Física", 1L))
                .thenReturn(true);

        assertThatThrownBy(() -> disciplineService.renameDiscipline("user@test.com", 1L, "Física"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("renameDiscipline deve lançar UsernameNotFoundException para id inexistente")
    void renameDiscipline_notFound_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(disciplineRepository.findByUserAndId(user, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> disciplineService.renameDiscipline("user@test.com", 99L, "X"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("deleteDiscipline deve remover a disciplina")
    void deleteDiscipline_success() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(disciplineRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(discipline));

        disciplineService.deleteDiscipline("user@test.com", 1L);

        verify(disciplineRepository).delete(discipline);
    }

    @Test
    @DisplayName("deleteDiscipline deve lançar UsernameNotFoundException para id inexistente")
    void deleteDiscipline_notFound_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(disciplineRepository.findByUserAndId(user, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> disciplineService.deleteDiscipline("user@test.com", 99L))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
