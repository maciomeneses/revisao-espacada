package com.ebbin.api.dto;

import com.ebbin.api.model.User;
import jakarta.validation.GroupSequence;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.UUID;

/**
 * DTO para transferência de dados de usuário nas operações de admin.
 *
 * <h3>Grupos de validação Jakarta</h3>
 * <ul>
 *   <li>{@link Default} — validações aplicadas a todas as operações (create e update):
 *       e-mail obrigatório e bem formado; senha, quando presente, deve ter no mínimo 6 chars.</li>
 *   <li>{@link OnCreate} — validações adicionais aplicadas <em>apenas</em> na criação:
 *       garante que o campo {@code password} não seja nulo nem em branco.</li>
 * </ul>
 *
 * <p>No controller, use {@code @Validated(UserDto.OnCreate.class)} para operações de criação
 * e {@code @Validated} (ou {@code @Valid}) para operações de atualização.</p>
 */
public record UserDto(
    UUID id,

    @Email(message = "E-mail inválido")
    @NotBlank(message = "E-mail é obrigatório")
    String email,

    /**
     * Senha em texto plano.
     * <ul>
     *   <li>Na <strong>criação</strong>: obrigatória e não-vazia (grupo {@link OnCreate}).</li>
     *   <li>Na <strong>atualização</strong>: opcional; quando fornecida deve ter ≥ 6 caracteres.</li>
     * </ul>
     * Nunca retornada nas respostas (o método {@link #from(User)} sempre envia {@code null}).
     */
    @NotBlank(message = "Senha é obrigatória", groups = OnCreate.class)
    @Size(min = 6, message = "Senha deve ter no mínimo 6 caracteres")
    String password,

    User.Role role
) {

    /**
     * Grupo de validação para operações de <strong>criação</strong> de usuário.
     * Inclui as restrições do grupo {@code Default} mais as restrições específicas de criação
     * (e.g., {@code password} obrigatório).
     *
     * <p>Uso no controller:
     * <pre>
     * &#64;PostMapping
     * public UserDto create(&#64;RequestBody &#64;Validated(UserDto.OnCreate.class) UserDto dto) { ... }
     * </pre>
     * </p>
     */
    public interface OnCreate {}

    /**
     * Sequência de grupos para criação: aplica {@code Default} antes de {@code OnCreate}.
     * Garante que validações básicas (e-mail, tamanho da senha) sejam avaliadas primeiro.
     */
    @GroupSequence({jakarta.validation.groups.Default.class, OnCreate.class})
    public interface CreateSequence {}

    public static UserDto from(User user) {
        return new UserDto(
            user.getId(),
            user.getEmail(),
            null, // Nunca retornar o hash da senha
            user.getRole()
        );
    }
}
