package com.ebbin.api.service;

import com.ebbin.api.dto.ExamEntryDto;
import com.ebbin.api.model.ExamEntry;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.ExamEntryRepository;
import com.ebbin.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ExamEntryService {

    private final ExamEntryRepository examEntryRepository;
    private final UserRepository userRepository;

    public ExamEntryService(ExamEntryRepository examEntryRepository,
                            UserRepository userRepository) {
        this.examEntryRepository = examEntryRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ExamEntryDto> list(String email) {
        User user = findUser(email);
        return examEntryRepository.findByUserOrderByExamDateDesc(user).stream()
                .map(ExamEntryDto::from)
                .toList();
    }

    @Transactional
    public ExamEntryDto create(String email, ExamEntryDto dto) {
        User user = findUser(email);
        ExamEntry entry = new ExamEntry();
        entry.setUser(user);
        dto.applyTo(entry);
        return ExamEntryDto.from(examEntryRepository.save(entry));
    }

    @Transactional
    public ExamEntryDto update(String email, Long id, ExamEntryDto dto) {
        User user = findUser(email);
        ExamEntry entry = examEntryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prova não encontrada"));
        dto.applyTo(entry);
        return ExamEntryDto.from(examEntryRepository.save(entry));
    }

    @Transactional
    public void delete(String email, Long id) {
        User user = findUser(email);
        ExamEntry entry = examEntryRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Prova não encontrada"));
        examEntryRepository.delete(entry);
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }
}
