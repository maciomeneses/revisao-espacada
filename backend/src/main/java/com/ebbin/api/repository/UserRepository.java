package com.ebbin.api.repository;

import com.ebbin.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);

    /**
     * Contas de self-signup nunca confirmadas criadas antes do instante de corte.
     * Usado pela purga periódica ({@code TokenCleanupService}); a exclusão em si
     * usa {@code deleteAll} entidade a entidade para respeitar os cascades.
     */
    @Query("SELECT u FROM User u WHERE u.emailVerified = false AND u.createdAt < :cutoff")
    List<User> findUnverifiedCreatedBefore(@Param("cutoff") LocalDateTime cutoff);
}
