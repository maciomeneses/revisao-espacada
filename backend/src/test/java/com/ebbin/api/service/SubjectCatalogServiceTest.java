package com.ebbin.api.service;

import com.ebbin.api.model.Area;
import com.ebbin.api.model.Discipline;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
import com.ebbin.api.repository.DisciplineRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.argThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SubjectCatalogService — seed ENEM baseline")
class SubjectCatalogServiceTest {

    @Mock AreaRepository areaRepository;
    @Mock DisciplineRepository disciplineRepository;

    @InjectMocks SubjectCatalogService subjectCatalogService;

    private User user;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@test.com");
        user.setRole(User.Role.USER);
    }

    @Test
    @DisplayName("seedDefaults deve criar as 4 áreas oficiais quando nenhuma existe")
    void seedDefaults_createsAllFourAreasWhenMissing() {
        when(areaRepository.findByUserAndName(eq(user), anyString())).thenReturn(Optional.empty());
        when(areaRepository.save(any(Area.class))).thenAnswer(inv -> inv.getArgument(0));
        when(disciplineRepository.existsByUserAndAreaAndName(any(), any(), anyString()))
                .thenReturn(false);
        when(disciplineRepository.save(any(Discipline.class))).thenAnswer(inv -> inv.getArgument(0));

        subjectCatalogService.seedDefaults(user);

        verify(areaRepository, times(4)).save(any(Area.class));
        // Baseline tem 9 disciplinas (3 + 1 + 4 + 1)
        verify(disciplineRepository, times(9)).save(any(Discipline.class));
    }

    @Test
    @DisplayName("seedDefaults deve preservar áreas/disciplinas existentes (idempotente)")
    void seedDefaults_idempotent() {
        Area ciencias = new Area();
        ciencias.setUser(user);
        ciencias.setName("Ciências da Natureza");

        // Somente "Ciências da Natureza" já existe; demais precisam ser criadas.
        when(areaRepository.findByUserAndName(eq(user), eq("Ciências da Natureza")))
                .thenReturn(Optional.of(ciencias));
        when(areaRepository.findByUserAndName(eq(user), argThat(name ->
                name != null && !name.equals("Ciências da Natureza"))))
                .thenReturn(Optional.empty());
        when(areaRepository.save(any(Area.class))).thenAnswer(inv -> inv.getArgument(0));

        // Biologia já existe dentro de Ciências; demais disciplinas são criadas.
        when(disciplineRepository.existsByUserAndAreaAndName(eq(user), eq(ciencias), eq("Biologia")))
                .thenReturn(true);
        when(disciplineRepository.existsByUserAndAreaAndName(
                eq(user), any(Area.class), argThat(name -> !"Biologia".equals(name))))
                .thenReturn(false);
        when(disciplineRepository.save(any(Discipline.class))).thenAnswer(inv -> inv.getArgument(0));

        subjectCatalogService.seedDefaults(user);

        // 3 áreas criadas (4 total menos Ciências que já existia)
        verify(areaRepository, times(3)).save(any(Area.class));
        // Biologia não cria; demais 8 disciplinas criadas
        verify(disciplineRepository, times(8)).save(any(Discipline.class));
    }

    @Test
    @DisplayName("ENEM_BASELINE deve conter as 4 áreas oficiais")
    void baselineContainsExpectedAreas() {
        assertThat(SubjectCatalogService.ENEM_BASELINE.keySet())
                .containsExactlyInAnyOrder(
                        "Ciências da Natureza",
                        "Matemática e suas Tecnologias",
                        "Ciências Humanas",
                        "Linguagens e Códigos");
    }

    @Test
    @DisplayName("ENEM_BASELINE deve listar as 9 disciplinas oficiais")
    void baselineContainsNineDisciplines() {
        List<String> all = SubjectCatalogService.ENEM_BASELINE.values().stream()
                .flatMap(List::stream)
                .toList();
        assertThat(all).hasSize(9);
    }
}
