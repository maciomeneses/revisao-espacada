package com.ebbin.api.service;

import com.ebbin.api.dto.AreaDto;
import com.ebbin.api.model.Area;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
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

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AreaService — CRUD de áreas por usuário")
class AreaServiceTest {

    @Mock AreaRepository areaRepository;
    @Mock UserRepository userRepository;

    @InjectMocks AreaService areaService;

    private User user;
    private Area area;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@test.com");
        user.setRole(User.Role.USER);

        area = new Area();
        area.setUser(user);
        area.setName("Ciências da Natureza");
    }

    @Test
    @DisplayName("getAreas deve retornar a lista do repositório mapeada em AreaDto")
    void getAreas_returnsList() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findAllByUserOrderByNameAsc(user)).thenReturn(List.of(area));

        List<AreaDto> result = areaService.getAreas("user@test.com");

        assertThat(result).singleElement()
                .satisfies(a -> assertThat(a.name()).isEqualTo("Ciências da Natureza"));
    }

    @Test
    @DisplayName("getAreas deve lançar UsernameNotFoundException para usuário inexistente")
    void getAreas_unknownUser_throws() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> areaService.getAreas("ghost@test.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("createArea deve salvar nova área quando nome ainda não existe")
    void createArea_success() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.existsByUserAndName(user, "Redação")).thenReturn(false);
        when(areaRepository.save(any(Area.class))).thenAnswer(inv -> inv.getArgument(0));

        AreaDto result = areaService.createArea("user@test.com", "  Redação  ");

        ArgumentCaptor<Area> captor = ArgumentCaptor.forClass(Area.class);
        verify(areaRepository).save(captor.capture());
        assertThat(captor.getValue().getName()).isEqualTo("Redação");
        assertThat(result.name()).isEqualTo("Redação");
    }

    @Test
    @DisplayName("createArea deve lançar IllegalArgumentException para nome duplicado")
    void createArea_duplicate_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.existsByUserAndName(user, "Ciências da Natureza")).thenReturn(true);

        assertThatThrownBy(() -> areaService.createArea("user@test.com", "Ciências da Natureza"))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("já existe");

        verify(areaRepository, never()).save(any());
    }

    @Test
    @DisplayName("createArea deve rejeitar nome vazio ou apenas espaços")
    void createArea_blank_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> areaService.createArea("user@test.com", "   "))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> areaService.createArea("user@test.com", null))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("createArea deve rejeitar nome com mais de 120 caracteres")
    void createArea_tooLong_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        String tooLong = "a".repeat(121);

        assertThatThrownBy(() -> areaService.createArea("user@test.com", tooLong))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("120");
    }

    @Test
    @DisplayName("renameArea deve atualizar o nome e propagar para subjects.area")
    void renameArea_success_propagates() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));
        when(areaRepository.existsByUserAndNameAndIdNot(user, "Natureza", 1L)).thenReturn(false);
        when(areaRepository.save(any(Area.class))).thenAnswer(inv -> inv.getArgument(0));
        when(areaRepository.renameSubjectsArea(user, "Ciências da Natureza", "Natureza")).thenReturn(3);

        AreaDto result = areaService.renameArea("user@test.com", 1L, "Natureza");

        assertThat(result.name()).isEqualTo("Natureza");
        verify(areaRepository).renameSubjectsArea(user, "Ciências da Natureza", "Natureza");
    }

    @Test
    @DisplayName("renameArea sem alteração (mesmo nome) deve ser no-op")
    void renameArea_sameName_noop() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));

        AreaDto result = areaService.renameArea("user@test.com", 1L, "Ciências da Natureza");

        assertThat(result.name()).isEqualTo("Ciências da Natureza");
        verify(areaRepository, never()).save(any());
        verify(areaRepository, never()).renameSubjectsArea(any(), any(), any());
    }

    @Test
    @DisplayName("renameArea deve rejeitar quando novo nome já é usado por outra área")
    void renameArea_duplicate_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));
        when(areaRepository.existsByUserAndNameAndIdNot(user, "Linguagens", 1L)).thenReturn(true);

        assertThatThrownBy(() -> areaService.renameArea("user@test.com", 1L, "Linguagens"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @DisplayName("renameArea deve lançar UsernameNotFoundException quando área não existe")
    void renameArea_notFound_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> areaService.renameArea("user@test.com", 99L, "X"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    @Test
    @DisplayName("deleteArea deve remover a área (cascade via FK remove disciplines e subjects)")
    void deleteArea_success() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(user, 1L)).thenReturn(Optional.of(area));

        areaService.deleteArea("user@test.com", 1L);

        verify(areaRepository).delete(area);
    }

    @Test
    @DisplayName("deleteArea deve lançar UsernameNotFoundException quando id é inválido")
    void deleteArea_notFound_throws() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(areaRepository.findByUserAndId(eq(user), any())).thenReturn(Optional.empty());

        assertThatThrownBy(() -> areaService.deleteArea("user@test.com", 99L))
                .isInstanceOf(UsernameNotFoundException.class);
    }
}
