package com.ebbin.api.dto;

import com.ebbin.api.model.User;
import java.util.UUID;

public record UserDto(
    UUID id,
    String email,
    String password, // Optional for updates
    User.Role role
) {
    public static UserDto from(User user) {
        return new UserDto(
            user.getId(),
            user.getEmail(),
            null, // Don't return password
            user.getRole()
        );
    }
}
