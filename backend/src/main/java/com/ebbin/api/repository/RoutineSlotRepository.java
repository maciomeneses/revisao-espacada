package com.ebbin.api.repository;

import com.ebbin.api.model.RoutineSlot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface RoutineSlotRepository extends JpaRepository<RoutineSlot, UUID> {

    List<RoutineSlot> findAllByUser_Id(UUID userId);

    Optional<RoutineSlot> findByUser_IdAndClientId(UUID userId, String clientId);

    @Modifying
    @Query("delete from RoutineSlot r where r.user.id = :userId and r.clientId not in :clientIds")
    void deleteByUserIdAndClientIdNotIn(@Param("userId") UUID userId,
                                        @Param("clientIds") Collection<String> clientIds);

    @Modifying
    @Query("delete from RoutineSlot r where r.user.id = :userId")
    void deleteAllByUserId(@Param("userId") UUID userId);
}
