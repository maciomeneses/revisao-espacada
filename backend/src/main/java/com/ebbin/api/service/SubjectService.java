package com.ebbin.api.service;

import com.ebbin.api.dto.SubjectDto;
import com.ebbin.api.model.Subject;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.SubjectRepository;
import com.ebbin.api.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class SubjectService {

    private final SubjectRepository subjectRepository;
    private final UserRepository userRepository;

    public SubjectService(SubjectRepository subjectRepository, UserRepository userRepository) {
        this.subjectRepository = subjectRepository;
        this.userRepository = userRepository;
    }

    public List<SubjectDto> getSubjects(String email) {
        User user = findUser(email);
        return subjectRepository.findAllByUser(user).stream()
                .map(SubjectDto::from)
                .toList();
    }

    @Transactional
    public List<SubjectDto> syncSubjects(String email, List<SubjectDto> dtos) {
        User user = findUser(email);
        List<Subject> existing = subjectRepository.findAllByUser(user);

        // Upsert each incoming subject
        for (SubjectDto dto : dtos) {
            Subject subject = existing.stream()
                    .filter(s -> s.getClientId().equals(dto.id()))
                    .findFirst()
                    .orElseGet(() -> {
                        Subject s = new Subject();
                        s.setUser(user);
                        return s;
                    });
            dto.applyTo(subject);
            subjectRepository.save(subject);
        }

        // Remove subjects no longer present in the client list
        var incomingIds = dtos.stream().map(SubjectDto::id).toList();
        existing.stream()
                .filter(s -> !incomingIds.contains(s.getClientId()))
                .forEach(subjectRepository::delete);

        return getSubjects(email);
    }

    @Transactional
    public SubjectDto upsertSubject(String email, SubjectDto dto) {
        User user = findUser(email);
        Subject subject = subjectRepository.findByUserAndClientId(user, dto.id())
                .orElseGet(() -> {
                    Subject s = new Subject();
                    s.setUser(user);
                    return s;
                });
        dto.applyTo(subject);
        return SubjectDto.from(subjectRepository.save(subject));
    }

    @Transactional
    public void deleteSubject(String email, String clientId) {
        User user = findUser(email);
        subjectRepository.deleteByUserAndClientId(user, clientId);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }
}
