package com.ebbin.api.service;

import com.ebbin.api.dto.ReviewEventDto;
import com.ebbin.api.model.ReviewEvent;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.ReviewEventRepository;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ReviewEventService {

    private static final Logger log = LoggerFactory.getLogger(ReviewEventService.class);

    private final ReviewEventRepository reviewEventRepository;
    private final UserRepository userRepository;

    public ReviewEventService(ReviewEventRepository reviewEventRepository,
                              UserRepository userRepository) {
        this.reviewEventRepository = reviewEventRepository;
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<ReviewEventDto> getEvents(String email) {
        User user = findUser(email);
        List<ReviewEventDto> result = reviewEventRepository
                .findAllByUserOrderByReviewDateDesc(user).stream()
                .map(ReviewEventDto::from)
                .toList();
        log.debug("getEvents: email={}, count={}", email, result.size());
        return result;
    }

    @Transactional
    public ReviewEventDto logEvent(String email, ReviewEventDto dto) {
        User user = findUser(email);
        ReviewEvent event = new ReviewEvent();
        event.setUser(user);
        dto.applyTo(event);
        ReviewEventDto result = ReviewEventDto.from(reviewEventRepository.save(event));
        log.debug("logEvent: email={}, subjectId={}, performance={}", email, dto.subjectId(), dto.performance());
        return result;
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + email));
    }
}
