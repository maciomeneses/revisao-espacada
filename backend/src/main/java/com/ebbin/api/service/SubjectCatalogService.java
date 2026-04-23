package com.ebbin.api.service;

import com.ebbin.api.model.Area;
import com.ebbin.api.model.Discipline;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
import com.ebbin.api.repository.DisciplineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

/**
 * Semeia o catálogo ENEM baseline (4 áreas + 9 disciplinas) para novos usuários,
 * espelhando o seed idempotente executado em {@code V10__areas_and_disciplines.sql}
 * para usuários existentes no momento da migration.
 *
 * <p>Idempotente: ignora pares (user, name) já existentes, permitindo ser chamado
 * em qualquer momento sem duplicar categorias nem sobrescrever customizações.
 */
@Service
public class SubjectCatalogService {

    private static final Logger log = LoggerFactory.getLogger(SubjectCatalogService.class);

    /**
     * Baseline oficial ENEM: área → lista de disciplinas. Manter alinhado com o seed
     * do V10 para garantir consistência entre usuários novos e pré-existentes.
     */
    static final Map<String, List<String>> ENEM_BASELINE = Map.of(
            "Ciências da Natureza", List.of("Biologia", "Física", "Química"),
            "Matemática e suas Tecnologias", List.of("Matemática"),
            "Ciências Humanas", List.of("Filosofia", "Geografia", "História", "Sociologia"),
            "Linguagens e Códigos", List.of("Linguagens")
    );

    private final AreaRepository areaRepository;
    private final DisciplineRepository disciplineRepository;

    public SubjectCatalogService(AreaRepository areaRepository,
                                 DisciplineRepository disciplineRepository) {
        this.areaRepository = areaRepository;
        this.disciplineRepository = disciplineRepository;
    }

    /**
     * Garante que o usuário tenha o baseline ENEM. Só cria entidades ausentes;
     * preserva quaisquer áreas/disciplinas customizadas ou pré-existentes.
     */
    @Transactional
    public void seedDefaults(User user) {
        int createdAreas = 0;
        int createdDisciplines = 0;
        for (Map.Entry<String, List<String>> entry : ENEM_BASELINE.entrySet()) {
            String areaName = entry.getKey();
            Area area = areaRepository.findByUserAndName(user, areaName).orElse(null);
            if (area == null) {
                area = new Area();
                area.setUser(user);
                area.setName(areaName);
                area = areaRepository.save(area);
                createdAreas++;
            }

            for (String disciplineName : entry.getValue()) {
                if (!disciplineRepository.existsByUserAndAreaAndName(user, area, disciplineName)) {
                    Discipline d = new Discipline();
                    d.setUser(user);
                    d.setArea(area);
                    d.setName(disciplineName);
                    disciplineRepository.save(d);
                    createdDisciplines++;
                }
            }
        }
        log.info("seedDefaults: user={}, createdAreas={}, createdDisciplines={}",
                user.getEmail(), createdAreas, createdDisciplines);
    }
}
