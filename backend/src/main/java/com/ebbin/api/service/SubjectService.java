package com.ebbin.api.service;

import com.ebbin.api.config.CacheConfig;
import com.ebbin.api.dto.SubjectDto;
import com.ebbin.api.model.Subject;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.SubjectRepository;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class SubjectService {

    private static final Logger log = LoggerFactory.getLogger(SubjectService.class);

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public SubjectService(SubjectRepository subjectRepository, UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    /**
     * Retorna a lista de subjects do usuário, servindo do cache quando disponível.
     * A chave de cache é o e-mail do usuário; o TTL é de 10 minutos (ver {@link CacheConfig}).
     * Toda operação de escrita (sync, upsert, delete) invalida esta entrada.
     */
    @Cacheable(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    @Transactional(readOnly = true)
    public List<SubjectDto> getSubjects(String email) {
        User user = findUser(email);
        List<SubjectDto> result = subjectRepository.findAllByUser(user).stream()
                .map(SubjectDto::from)
                .toList();
        log.debug("getSubjects: email={}, count={}", email, result.size());
        return result;
    }

    /**
     * Sincronização completa — upsert dos subjects recebidos e remoção dos ausentes.
     * Usa um Map para evitar N+1 queries na busca por clientId (O(n) em vez de O(n²)).
     * Invalida o cache de leitura para que a próxima chamada a getSubjects reflita o estado atual.
     */
    @CacheEvict(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    @Transactional
    public List<SubjectDto> syncSubjects(String email, List<SubjectDto> dtos) {
        User user = findUser(email);
        List<Subject> existing = subjectRepository.findAllByUser(user);

        // Indexa existentes por clientId para lookup O(1)
        Map<String, Subject> existingByClientId = existing.stream()
                .collect(Collectors.toMap(Subject::getClientId, Function.identity()));

        for (SubjectDto dto : dtos) {
            Subject subject = existingByClientId.getOrDefault(dto.id(), createSubjectForUser(user));
            dto.applyTo(subject);
            subjectRepository.save(subject);
        }

        // Remove subjects não presentes na lista do cliente
        Set<String> incomingIds = dtos.stream().map(SubjectDto::id).collect(Collectors.toSet());
        List<Subject> toDelete = existing.stream()
                .filter(s -> !incomingIds.contains(s.getClientId()))
                .toList();
        subjectRepository.deleteAll(toDelete);

        log.info("syncSubjects: email={}, upserted={}, deleted={}", email, dtos.size(), toDelete.size());
        return getSubjects(email);
    }

    @CacheEvict(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    @Transactional
    public SubjectDto upsertSubject(String email, SubjectDto dto) {
        User user = findUser(email);
        Subject subject = subjectRepository.findByUserAndClientId(user, dto.id())
                .orElseGet(() -> createSubjectForUser(user));
        dto.applyTo(subject);
        SubjectDto result = SubjectDto.from(subjectRepository.save(subject));
        log.debug("upsertSubject: email={}, clientId={}", email, dto.id());
        return result;
    }

    @CacheEvict(cacheNames = CacheConfig.SUBJECTS_CACHE, key = "#email")
    @Transactional
    public void deleteSubject(String email, String clientId) {
        User user = findUser(email);
        subjectRepository.deleteByUserAndClientId(user, clientId);
        log.info("deleteSubject: email={}, clientId={}", email, clientId);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }

    private Subject createSubjectForUser(User user) {
        Subject s = new Subject();
        s.setUser(user);
        return s;
    }
}
