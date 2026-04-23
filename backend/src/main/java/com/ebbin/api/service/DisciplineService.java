package com.ebbin.api.service;

import com.ebbin.api.config.CacheConfig;
import com.ebbin.api.dto.DisciplineDto;
import com.ebbin.api.model.Area;
import com.ebbin.api.model.Discipline;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
import com.ebbin.api.repository.DisciplineRepository;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * CRUD de {@link Discipline} com ownership por usuário. Rename propaga para
 * {@code subjects.modulo}; delete depende do FK cascade para remover subjects.
 */
@Service
public class DisciplineService {

    private static final Logger log = LoggerFactory.getLogger(DisciplineService.class);

    private final DisciplineRepository disciplineRepository;
    private final AreaRepository areaRepository;
    private final UserRepository userRepository;

    public DisciplineService(DisciplineRepository disciplineRepository,
                             AreaRepository areaRepository,
                             UserRepository userRepository) {
        this.disciplineRepository = disciplineRepository;
        this.areaRepository = areaRepository;
        this.userRepository = userRepository;
    }

    @Cacheable(cacheNames = CacheConfig.DISCIPLINES_CACHE, key = "#email")
    @Transactional(readOnly = true)
    public List<DisciplineDto> getDisciplines(String email) {
        User user = findUser(email);
        List<DisciplineDto> result = disciplineRepository.findAllByUserOrderByNameAsc(user).stream()
                .map(DisciplineDto::from)
                .toList();
        log.debug("getDisciplines: email={}, count={}", email, result.size());
        return result;
    }

    @Transactional(readOnly = true)
    public List<DisciplineDto> getDisciplinesByArea(String email, Long areaId) {
        User user = findUser(email);
        Area area = findArea(user, areaId);
        return disciplineRepository.findAllByUserAndAreaOrderByNameAsc(user, area).stream()
                .map(DisciplineDto::from)
                .toList();
    }

    @CacheEvict(cacheNames = CacheConfig.DISCIPLINES_CACHE, key = "#email")
    @Transactional
    public DisciplineDto createDiscipline(String email, Long areaId, String name) {
        User user = findUser(email);
        Area area = findArea(user, areaId);
        String trimmed = requireName(name);
        if (disciplineRepository.existsByUserAndAreaAndName(user, area, trimmed)) {
            throw new IllegalArgumentException("Disciplina já existe nessa área: " + trimmed);
        }
        Discipline d = new Discipline();
        d.setUser(user);
        d.setArea(area);
        d.setName(trimmed);
        Discipline saved = disciplineRepository.save(d);
        log.info("createDiscipline: email={}, id={}, areaId={}, name={}",
                email, saved.getId(), areaId, saved.getName());
        return DisciplineDto.from(saved);
    }

    @Caching(evict = {
        @CacheEvict(cacheNames = CacheConfig.DISCIPLINES_CACHE, key = "#email"),
        @CacheEvict(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    })
    @Transactional
    public DisciplineDto renameDiscipline(String email, Long id, String newName) {
        User user = findUser(email);
        String trimmed = requireName(newName);
        Discipline d = disciplineRepository.findByUserAndId(user, id)
                .orElseThrow(() -> new UsernameNotFoundException("Disciplina não encontrada: " + id));
        if (trimmed.equals(d.getName())) {
            return DisciplineDto.from(d);
        }
        if (disciplineRepository.existsByUserAndAreaAndNameAndIdNot(user, d.getArea(), trimmed, id)) {
            throw new IllegalArgumentException("Disciplina já existe nessa área: " + trimmed);
        }
        String oldName = d.getName();
        d.setName(trimmed);
        disciplineRepository.save(d);
        int updated = disciplineRepository.renameSubjectsModulo(
                user, d.getArea().getName(), oldName, trimmed);
        log.info("renameDiscipline: email={}, id={}, oldName={}, newName={}, subjectsUpdated={}",
                email, id, oldName, trimmed, updated);
        return DisciplineDto.from(d);
    }

    @Caching(evict = {
        @CacheEvict(cacheNames = CacheConfig.DISCIPLINES_CACHE, key = "#email"),
        @CacheEvict(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    })
    @Transactional
    public void deleteDiscipline(String email, Long id) {
        User user = findUser(email);
        Discipline d = disciplineRepository.findByUserAndId(user, id)
                .orElseThrow(() -> new UsernameNotFoundException("Disciplina não encontrada: " + id));
        disciplineRepository.delete(d);
        log.info("deleteDiscipline: email={}, id={}, name={}", email, id, d.getName());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }

    private Area findArea(User user, Long areaId) {
        return areaRepository.findByUserAndId(user, areaId)
                .orElseThrow(() -> new UsernameNotFoundException("Área não encontrada: " + areaId));
    }

    private static String requireName(String name) {
        if (name == null) throw new IllegalArgumentException("Nome da disciplina é obrigatório");
        String trimmed = name.trim();
        if (trimmed.isEmpty()) throw new IllegalArgumentException("Nome da disciplina é obrigatório");
        if (trimmed.length() > 120) throw new IllegalArgumentException("Nome da disciplina excede 120 caracteres");
        return trimmed;
    }
}
