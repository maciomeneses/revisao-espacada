package com.ebbin.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Payload do auto-cadastro público ({@code POST /api/auth/signup}).
 *
 * <p>Sem campo {@code role}: contas de self-signup são sempre {@code USER} —
 * o papel é fixado no serviço, nunca vindo do cliente (OWASP A01).</p>
 */
public record SignupRequest(
    @Email(message = "E-mail inválido")
    @NotBlank(message = "E-mail é obrigatório")
    String email,

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 8, max = 100, message = "Senha deve ter entre 8 e 100 caracteres")
    @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).*$",
             message = "Senha deve conter ao menos uma letra e um número")
    String password
) {}
