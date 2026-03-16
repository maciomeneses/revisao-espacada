package com.ebbin.api.dto;

import com.ebbin.api.model.User;

import java.util.UUID;

public record LoginResponse(
    String token,
    UUID userId,
    String email,
    String role
) {
    public static LoginResponse of(String token, User user) {
        return new LoginResponse(
            token,
            user.getId(),
            user.getEmail(),
            user.getRole().name()
        );
    }
}
