package com.ebbin.api.repository;

import com.ebbin.api.model.Subject;
import com.ebbin.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface SubjectRepository extends JpaRepository<Subject, Long> {
    List<Subject> findAllByUser(User user);
    Optional<Subject> findByUserAndClientId(User user, String clientId);
    void deleteByUserAndClientId(User user, String clientId);
}
