package com.ebbin.api.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * Payload para solicitação de reset de senha via {@code POST /api/auth/forgot-password}.
 */
public record PasswordResetRequest(
    @NotBlank(message = "E-mail é obrigatório")
    @Email(message = "E-mail inválido")
    String email
) {}
