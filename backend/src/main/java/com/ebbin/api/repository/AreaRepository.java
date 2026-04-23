package com.ebbin.api.repository;

import com.ebbin.api.model.Area;
import com.ebbin.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AreaRepository extends JpaRepository<Area, Long> {
    List<Area> findAllByUserOrderByNameAsc(User user);
    Optional<Area> findByUserAndId(User user, Long id);
    Optional<Area> findByUserAndName(User user, String name);
    boolean existsByUserAndName(User user, String name);
    boolean existsByUserAndNameAndIdNot(User user, String name, Long id);

    /**
     * Propaga o rename para os subjects que carregam a string legada {@code area}.
     * Mantém coerência com o DTO enquanto a migration V11 não removeu o campo.
     * {@code clearAutomatically} evita ler Subjects desatualizados do persistence
     * context após o UPDATE em lote.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Subject s SET s.area = :newName WHERE s.user = :user AND s.area = :oldName")
    int renameSubjectsArea(@Param("user") User user,
                           @Param("oldName") String oldName,
                           @Param("newName") String newName);
}
