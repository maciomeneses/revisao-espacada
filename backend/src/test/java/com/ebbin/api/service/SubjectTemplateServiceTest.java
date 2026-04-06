package com.ebbin.api.service;

import com.ebbin.api.dto.SubjectTemplateDto;
import com.ebbin.api.model.SubjectTemplate;
import com.ebbin.api.repository.SubjectTemplateRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SubjectTemplateService — listagem de templates")
class SubjectTemplateServiceTest {

    @Mock SubjectTemplateRepository templateRepository;
    @InjectMocks SubjectTemplateService service;

    private SubjectTemplate fisica;
    private SubjectTemplate biologia;

    @BeforeEach
    void setUp() {
        fisica = new SubjectTemplate();
        fisica.setArea("Ciências da Natureza");
        fisica.setDisciplina("Física");
        fisica.setAssunto("Leis de Newton");
        fisica.setRelevancia("Alta");

        biologia = new SubjectTemplate();
        biologia.setArea("Ciências da Natureza");
        biologia.setDisciplina("Biologia");
        biologia.setAssunto("Genética Mendeliana");
        biologia.setRelevancia("Alta");
    }

    @Test
    @DisplayName("listAll retorna todos os templates ordenados")
    void listAll_returnsAll() {
        when(templateRepository.findAllByOrderByAssuntoAsc()).thenReturn(List.of(biologia, fisica));

        List<SubjectTemplateDto> result = service.listAll();

        assertThat(result).hasSize(2);
        assertThat(result.get(0).assunto()).isEqualTo("Genética Mendeliana");
        assertThat(result.get(1).assunto()).isEqualTo("Leis de Newton");
        verify(templateRepository).findAllByOrderByAssuntoAsc();
    }

    @Test
    @DisplayName("listAll retorna lista vazia quando não há templates")
    void listAll_empty() {
        when(templateRepository.findAllByOrderByAssuntoAsc()).thenReturn(List.of());

        List<SubjectTemplateDto> result = service.listAll();

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("listByDisciplina filtra corretamente por disciplina")
    void listByDisciplina_filtered() {
        when(templateRepository.findByDisciplinaIgnoreCaseOrderByAssuntoAsc("Física"))
                .thenReturn(List.of(fisica));

        List<SubjectTemplateDto> result = service.listByDisciplina("Física");

        assertThat(result).hasSize(1);
        assertThat(result.get(0).disciplina()).isEqualTo("Física");
        assertThat(result.get(0).assunto()).isEqualTo("Leis de Newton");
    }

    @Test
    @DisplayName("listByDisciplina retorna vazio para disciplina inexistente")
    void listByDisciplina_notFound() {
        when(templateRepository.findByDisciplinaIgnoreCaseOrderByAssuntoAsc("Inexistente"))
                .thenReturn(List.of());

        List<SubjectTemplateDto> result = service.listByDisciplina("Inexistente");

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("SubjectTemplateDto.from mapeia todos os campos corretamente")
    void dto_from_mapsAllFields() {
        SubjectTemplateDto dto = SubjectTemplateDto.from(fisica);

        assertThat(dto.area()).isEqualTo("Ciências da Natureza");
        assertThat(dto.disciplina()).isEqualTo("Física");
        assertThat(dto.assunto()).isEqualTo("Leis de Newton");
        assertThat(dto.relevancia()).isEqualTo("Alta");
    }
}
