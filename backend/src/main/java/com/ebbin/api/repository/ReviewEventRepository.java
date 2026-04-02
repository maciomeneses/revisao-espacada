package com.ebbin.api.repository;

import com.ebbin.api.model.ReviewEvent;
import com.ebbin.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface ReviewEventRepository extends JpaRepository<ReviewEvent, Long> {
    List<ReviewEvent> findAllByUserOrderByReviewDateDesc(User user);
}
