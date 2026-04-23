package com.ebbin.api.service;

import com.ebbin.api.config.CacheConfig;
import com.ebbin.api.dto.AreaDto;
import com.ebbin.api.model.Area;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.AreaRepository;
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
 * CRUD de {@link Area} com ownership por usuário. Rename propaga para a string
 * legada {@code subjects.area}; delete depende do FK cascade para remover
 * disciplines e subjects associados. Cache invalidado de forma coordenada em
 * escritas que alteram mais de uma entidade (ex.: rename também evict discipline/subject).
 */
@Service
public class AreaService {

    private static final Logger log = LoggerFactory.getLogger(AreaService.class);

    private final AreaRepository areaRepository;
    private final UserRepository userRepository;

    public AreaService(AreaRepository areaRepository, UserRepository userRepository) {
        this.areaRepository = areaRepository;
        this.userRepository = userRepository;
    }

    @Cacheable(cacheNames = CacheConfig.AREAS_CACHE, key = "#email")
    @Transactional(readOnly = true)
    public List<AreaDto> getAreas(String email) {
        User user = findUser(email);
        List<AreaDto> result = areaRepository.findAllByUserOrderByNameAsc(user).stream()
                .map(AreaDto::from)
                .toList();
        log.debug("getAreas: email={}, count={}", email, result.size());
        return result;
    }

    @CacheEvict(cacheNames = CacheConfig.AREAS_CACHE, key = "#email")
    @Transactional
    public AreaDto createArea(String email, String name) {
        User user = findUser(email);
        String trimmed = requireName(name);
        if (areaRepository.existsByUserAndName(user, trimmed)) {
            throw new IllegalArgumentException("Área já existe: " + trimmed);
        }
        Area area = new Area();
        area.setUser(user);
        area.setName(trimmed);
        Area saved = areaRepository.save(area);
        log.info("createArea: email={}, id={}, name={}", email, saved.getId(), saved.getName());
        return AreaDto.from(saved);
    }

    /**
     * Renomeia a Area e propaga o novo nome para {@code subjects.area}. Evict
     * dos caches de areas e subjects (este último depende da string legada).
     */
    @Caching(evict = {
        @CacheEvict(cacheNames = CacheConfig.AREAS_CACHE, key = "#email"),
        @CacheEvict(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    })
    @Transactional
    public AreaDto renameArea(String email, Long id, String newName) {
        User user = findUser(email);
        String trimmed = requireName(newName);
        Area area = areaRepository.findByUserAndId(user, id)
                .orElseThrow(() -> new UsernameNotFoundException("Área não encontrada: " + id));
        if (trimmed.equals(area.getName())) {
            return AreaDto.from(area);
        }
        if (areaRepository.existsByUserAndNameAndIdNot(user, trimmed, id)) {
            throw new IllegalArgumentException("Área já existe: " + trimmed);
        }
        String oldName = area.getName();
        area.setName(trimmed);
        areaRepository.save(area);
        int updatedSubjects = areaRepository.renameSubjectsArea(user, oldName, trimmed);
        log.info("renameArea: email={}, id={}, oldName={}, newName={}, subjectsUpdated={}",
                email, id, oldName, trimmed, updatedSubjects);
        return AreaDto.from(area);
    }

    /**
     * Remove a Area. Cascade no FK (areas → disciplines → subjects) apaga toda a
     * hierarquia. Evict de todos os caches afetados.
     */
    @Caching(evict = {
        @CacheEvict(cacheNames = CacheConfig.AREAS_CACHE, key = "#email"),
        @CacheEvict(cacheNames = CacheConfig.DISCIPLINES_CACHE, key = "#email"),
        @CacheEvict(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    })
    @Transactional
    public void deleteArea(String email, Long id) {
        User user = findUser(email);
        Area area = areaRepository.findByUserAndId(user, id)
                .orElseThrow(() -> new UsernameNotFoundException("Área não encontrada: " + id));
        areaRepository.delete(area);
        log.info("deleteArea: email={}, id={}, name={}", email, id, area.getName());
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }

    private static String requireName(String name) {
        if (name == null) throw new IllegalArgumentException("Nome da área é obrigatório");
        String trimmed = name.trim();
        if (trimmed.isEmpty()) throw new IllegalArgumentException("Nome da área é obrigatório");
        if (trimmed.length() > 120) throw new IllegalArgumentException("Nome da área excede 120 caracteres");
        return trimmed;
    }
}
