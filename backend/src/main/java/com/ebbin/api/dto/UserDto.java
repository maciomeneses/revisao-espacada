package com.ebbin.api.dto;

import com.ebbin.api.model.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public record UserDto(
    UUID id,

    @Email(message = "E-mail inválido")
    @NotBlank(message = "E-mail é obrigatório")
    String email,

    /** Opcional para atualizações; obrigatório na criação (validado na camada de serviço) */
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    String password,

    User.Role role
) {
    public static UserDto from(User user) {
        return new UserDto(
            user.getId(),
            user.getEmail(),
            null, // Nunca retornar o hash da senha
            user.getRole()
        );
    }
}
