package com.ebbin.api.repository;

import com.ebbin.api.model.ExamEntry;
import com.ebbin.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ExamEntryRepository extends JpaRepository<ExamEntry, Long> {

    List<ExamEntry> findByUserOrderByExamDateDesc(User user);

    Optional<ExamEntry> findByIdAndUser(Long id, User user);
}
