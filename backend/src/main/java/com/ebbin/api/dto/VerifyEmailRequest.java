package com.ebbin.api.dto;

import jakarta.validation.constraints.NotBlank;

/** Payload da confirmação de e-mail ({@code POST /api/auth/verify-email}). */
public record VerifyEmailRequest(
    @NotBlank(message = "Token é obrigatório")
    String token
) {}
