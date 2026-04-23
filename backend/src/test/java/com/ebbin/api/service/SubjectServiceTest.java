package com.ebbin.api.service;

import com.ebbin.api.dto.SubjectDto;
import com.ebbin.api.model.Area;
import com.ebbin.api.model.Discipline;
import com.ebbin.api.model.PerformanceLevel;
import com.ebbin.api.model.ReviewStage;
import com.ebbin.api.model.Subject;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
import com.ebbin.api.repository.DisciplineRepository;
import com.ebbin.api.repository.SubjectRepository;
import com.ebbin.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SubjectService — CRUD e sincronização de subjects")
class SubjectServiceTest {

    @Mock SubjectRepository subjectRepository;
    @Mock UserRepository userRepository;
    @Mock AreaRepository areaRepository;
    @Mock DisciplineRepository disciplineRepository;

    @InjectMocks SubjectService subjectService;

    private User user;
    private Subject existingSubject;
    private SubjectDto subjectDto;

    @BeforeEach
    void setUp() {
        user = new User();
        user.setEmail("user@test.com");
        user.setRole(User.Role.USER);

        existingSubject = new Subject();
        existingSubject.setClientId("client-1");
        existingSubject.setUser(user);
        existingSubject.setModulo("Módulo 1");
        existingSubject.setArea("Área 1");
        existingSubject.setAulaPrincipal("Aula Principal 1");
        existingSubject.setRelevancia("Alta");
        existingSubject.setCurrentStage(ReviewStage.AULA);
        existingSubject.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);

        subjectDto = new SubjectDto(
                "client-1", "Módulo 1", "Área 1", "Aula Principal 1", "Alta",
                false, false, false, false, false, false, false, false, false,
                "aula", null, null, null, "nao_classificada"
        );
    }

    /**
     * Stub do {@link com.ebbin.api.service.SubjectService.CatalogCache} para tests de mutação:
     * os repositórios de Area/Discipline são acessados lazy dentro de upsert/sync. Os stubs são
     * lenient porque testes de leitura (getSubjects, delete) não os exercitam.
     */
    private void stubCatalogResolution() {
        lenient().when(areaRepository.findByUserAndName(eq(user), anyString()))
                .thenAnswer(inv -> {
                    Area a = new Area();
                    a.setUser(user);
                    a.setName(inv.getArgument(1));
                    return Optional.of(a);
                });
        lenient().when(disciplineRepository.findByUserAndAreaAndName(eq(user), any(Area.class), anyString()))
                .thenAnswer(inv -> {
                    Discipline d = new Discipline();
                    d.setUser(user);
                    d.setArea(inv.getArgument(1));
                    d.setName(inv.getArgument(2));
                    return Optional.of(d);
                });
    }

    // --- getSubjects ---

    @Test
    @DisplayName("getSubjects deve retornar lista de SubjectDto do usuário")
    void getSubjects_returnsUserSubjects() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findAllByUser(user)).thenReturn(List.of(existingSubject));

        List<SubjectDto> result = subjectService.getSubjects("user@test.com");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).id()).isEqualTo("client-1");
    }

    @Test
    @DisplayName("getSubjects deve lançar UsernameNotFoundException para usuário inexistente")
    void getSubjects_unknownUser_throwsException() {
        when(userRepository.findByEmail("ghost@test.com")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> subjectService.getSubjects("ghost@test.com"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    // --- syncSubjects ---

    @Test
    @DisplayName("syncSubjects deve fazer upsert de subjects recebidos")
    void syncSubjects_upsertsIncomingSubjects() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findAllByUser(user)).thenReturn(new ArrayList<>(List.of(existingSubject)));
        when(subjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(subjectRepository.findAllByUser(user)).thenReturn(List.of(existingSubject));
        stubCatalogResolution();

        subjectService.syncSubjects("user@test.com", List.of(subjectDto), false);

        verify(subjectRepository, atLeastOnce()).save(any(Subject.class));
    }

    @Test
    @DisplayName("syncSubjects com destructive=true deve remover subjects ausentes na lista enviada")
    void syncSubjects_destructive_deletesRemovedSubjects() {
        Subject toDelete = new Subject();
        toDelete.setClientId("client-to-delete");
        toDelete.setUser(user);
        toDelete.setModulo("M"); toDelete.setArea("A");
        toDelete.setAulaPrincipal("AP"); toDelete.setRelevancia("Alta");
        toDelete.setCurrentStage(ReviewStage.AULA); toDelete.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findAllByUser(user))
                .thenReturn(new ArrayList<>(List.of(existingSubject, toDelete)))
                .thenReturn(List.of(existingSubject));
        when(subjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubCatalogResolution();

        // Só envia "client-1"; com destructive=true, "client-to-delete" deve ser removido
        subjectService.syncSubjects("user@test.com", List.of(subjectDto), true);

        verify(subjectRepository).deleteAll(argThat(list -> {
            List<Subject> deleted = new ArrayList<>();
            list.forEach(deleted::add);
            return deleted.stream().anyMatch(s -> "client-to-delete".equals(s.getClientId()));
        }));
    }

    @Test
    @DisplayName("syncSubjects com destructive=false (padrão) deve preservar subjects ausentes na lista")
    void syncSubjects_nonDestructive_keepsAbsentSubjects() {
        Subject other = new Subject();
        other.setClientId("client-other");
        other.setUser(user);
        other.setModulo("M2"); other.setArea("A2");
        other.setAulaPrincipal("AP2"); other.setRelevancia("Média");
        other.setCurrentStage(ReviewStage.AULA); other.setPerformanceLevel(PerformanceLevel.NAO_CLASSIFICADA);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findAllByUser(user))
                .thenReturn(new ArrayList<>(List.of(existingSubject, other)))
                .thenReturn(List.of(existingSubject, other));
        when(subjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubCatalogResolution();

        // Só envia "client-1"; com destructive=false, "client-other" deve ser preservado
        subjectService.syncSubjects("user@test.com", List.of(subjectDto), false);

        verify(subjectRepository, never()).deleteAll(any());
    }

    // --- upsertSubject ---

    @Test
    @DisplayName("upsertSubject deve criar novo subject quando não existir")
    void upsertSubject_createsNewWhenNotFound() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findByUserAndClientId(user, "client-new")).thenReturn(Optional.empty());
        when(subjectRepository.save(any())).thenAnswer(inv -> {
            Subject s = inv.getArgument(0);
            s.setClientId("client-new");
            return s;
        });
        stubCatalogResolution();

        SubjectDto newDto = new SubjectDto(
                "client-new", "M", "A", "AP", "Alta",
                false, false, false, false, false, false, false, false, false,
                "aula", null, null, null, "nao_classificada"
        );

        SubjectDto result = subjectService.upsertSubject("user@test.com", newDto);
        assertThat(result.id()).isEqualTo("client-new");
        verify(subjectRepository).save(any(Subject.class));
    }

    @Test
    @DisplayName("upsertSubject deve atualizar subject existente")
    void upsertSubject_updatesExisting() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findByUserAndClientId(user, "client-1")).thenReturn(Optional.of(existingSubject));
        when(subjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubCatalogResolution();

        SubjectDto updated = new SubjectDto(
                "client-1", "Módulo Atualizado", "Área 1", "Aula Principal 1", "Alta",
                true, false, false, false, false, false, false, false, false,
                "Learning", LocalDate.now().plusDays(3), null, "3", "bom"
        );

        SubjectDto result = subjectService.upsertSubject("user@test.com", updated);
        assertThat(result.aulaAssistida()).isTrue();
        assertThat(result.currentStage()).isEqualTo("Learning");
    }

    // --- deleteSubject ---

    @Test
    @DisplayName("deleteSubject deve chamar o repositório para remoção")
    void deleteSubject_callsRepository() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        subjectService.deleteSubject("user@test.com", "client-1");

        verify(subjectRepository).deleteByUserAndClientId(user, "client-1");
    }

    // --- lastPerformance como PerformanceLevel enum ---

    @Test
    @DisplayName("upsertSubject deve persistir lastPerformance como enum quando valor válido")
    void upsertSubject_persistsLastPerformanceEnum() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findByUserAndClientId(user, "client-1")).thenReturn(Optional.of(existingSubject));
        when(subjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubCatalogResolution();

        SubjectDto withPerformance = new SubjectDto(
                "client-1", "Módulo 1", "Área 1", "Aula Principal 1", "Alta",
                true, false, false, false, false, false, false, false, false,
                "Review", LocalDate.now(), LocalDate.now().minusDays(7), "bom", "bom"
        );

        SubjectDto result = subjectService.upsertSubject("user@test.com", withPerformance);
        assertThat(result.lastPerformance()).isEqualTo("bom");
        assertThat(result.performanceLevel()).isEqualTo("bom");
    }

    @Test
    @DisplayName("upsertSubject deve aceitar lastPerformance nulo (sem revisão prévia)")
    void upsertSubject_acceptsNullLastPerformance() {
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(subjectRepository.findByUserAndClientId(user, "client-1")).thenReturn(Optional.of(existingSubject));
        when(subjectRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        stubCatalogResolution();

        SubjectDto withNullPerformance = new SubjectDto(
                "client-1", "Módulo 1", "Área 1", "Aula Principal 1", "Alta",
                false, false, false, false, false, false, false, false, false,
                "aula", null, null, null, "nao_classificada"
        );

        SubjectDto result = subjectService.upsertSubject("user@test.com", withNullPerformance);
        assertThat(result.lastPerformance()).isNull();
    }
}
