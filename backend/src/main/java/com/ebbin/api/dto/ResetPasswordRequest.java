package com.ebbin.api.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Payload para o endpoint {@code POST /api/auth/reset-password}.
 *
 * <p>O {@code token} é o UUID recebido via link de reset; {@code newPassword} é a nova
 * senha escolhida pelo usuário, sujeita às mesmas regras de tamanho mínimo do login.</p>
 */
public record ResetPasswordRequest(

    @NotBlank(message = "Token é obrigatório")
    String token,

    @NotBlank(message = "Nova senha é obrigatória")
    @Size(min = 6, message = "A senha deve ter no mínimo 6 caracteres")
    String newPassword
) {}
