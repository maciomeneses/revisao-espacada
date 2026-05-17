package com.ebbin.api.dto;

import com.ebbin.api.model.UserPreferences;

import java.util.Arrays;
import java.util.List;

/**
 * DTO de preferências do usuário expostas pela API.
 *
 * <p>{@code allowedReviewDays} é serializado como lista de inteiros (0..6) para
 * facilitar o consumo pelo frontend, ainda que internamente seja armazenado
 * como {@code SMALLINT[]} no PostgreSQL.
 */
public record UserPreferencesDto(List<Integer> allowedReviewDays) {

    public static UserPreferencesDto from(UserPreferences prefs) {
        Short[] days = prefs.getAllowedReviewDays();
        List<Integer> list = days == null
                ? List.of()
                : Arrays.stream(days).map(Short::intValue).sorted().toList();
        return new UserPreferencesDto(list);
    }
}
