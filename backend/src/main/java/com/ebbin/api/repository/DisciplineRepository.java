package com.ebbin.api.repository;

import com.ebbin.api.model.Area;
import com.ebbin.api.model.Discipline;
import com.ebbin.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface DisciplineRepository extends JpaRepository<Discipline, Long> {
    List<Discipline> findAllByUserOrderByNameAsc(User user);
    List<Discipline> findAllByUserAndAreaOrderByNameAsc(User user, Area area);
    Optional<Discipline> findByUserAndId(User user, Long id);
    Optional<Discipline> findByUserAndAreaAndName(User user, Area area, String name);
    boolean existsByUserAndAreaAndName(User user, Area area, String name);
    boolean existsByUserAndAreaAndNameAndIdNot(User user, Area area, String name, Long id);
    long countByUserAndArea(User user, Area area);

    /**
     * Propaga o rename para os subjects que carregam a string legada {@code modulo}.
     * O escopo inclui a Area, pois (user_id, area, modulo) é único por discipline.
     * {@code clearAutomatically} evita ler Subjects desatualizados do persistence
     * context após o UPDATE em lote.
     */
    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("UPDATE Subject s SET s.modulo = :newName " +
           "WHERE s.user = :user AND s.area = :areaName AND s.modulo = :oldName")
    int renameSubjectsModulo(@Param("user") User user,
                             @Param("areaName") String areaName,
                             @Param("oldName") String oldName,
                             @Param("newName") String newName);
}
