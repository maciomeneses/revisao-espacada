package com.ebbin.api.dto;

import com.ebbin.api.model.RoutineSlot;

/**
 * DTO de um slot de rotina exposto pela API. Espelha o tipo TypeScript
 * {@code RoutineSlot} do frontend.
 *
 * <p>{@code id} corresponde ao identificador gerado no cliente (
 * {@code ${Date.now()}_<rand>}) e é a chave de upsert por (user, clientId).
 * O UUID interno do banco não é exposto.
 */
public record RoutineSlotDto(
        String id,
        Integer dayOfWeek,
        String title,
        String startTime,
        String endTime,
        String type,
        String area
) {

    public static RoutineSlotDto from(RoutineSlot slot) {
        return new RoutineSlotDto(
                slot.getClientId(),
                slot.getDayOfWeek() == null ? null : slot.getDayOfWeek().intValue(),
                slot.getTitle(),
                slot.getStartTime(),
                slot.getEndTime(),
                slot.getSlotType(),
                slot.getArea()
        );
    }
}
