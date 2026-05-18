package com.ebbin.api.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/**
 * Testes unitários para {@link GlobalExceptionHandler}.
 *
 * <p>Verifica o mapeamento correto de exceções para respostas RFC 9457 (ProblemDetail)
 * e que o status HTTP correto é retornado em cada caso.</p>
 */
@DisplayName("GlobalExceptionHandler — cobertura de handlers de exceção")
class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @Test
    @DisplayName("IllegalArgumentException deve retornar 409 Conflict com tipo problem:conflict")
    void handleIllegalArgument_returns409() {
        ProblemDetail pd = handler.handleIllegalArgument(new IllegalArgumentException("E-mail já cadastrado"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.CONFLICT.value());
        assertThat(pd.getDetail()).isEqualTo("E-mail já cadastrado");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:conflict");
        assertThat(pd.getTitle()).isEqualTo("Conflito de dados");
    }

    @Test
    @DisplayName("BadCredentialsException deve retornar 401 com tipo problem:unauthorized")
    void handleBadCredentials_returns401() {
        ProblemDetail pd = handler.handleBadCredentials(new BadCredentialsException("bad creds"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.UNAUTHORIZED.value());
        assertThat(pd.getDetail()).isEqualTo("Credenciais inválidas");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:unauthorized");
        assertThat(pd.getTitle()).isEqualTo("Não autorizado");
    }

    @Test
    @DisplayName("UsernameNotFoundException deve retornar 404 com tipo problem:not-found")
    void handleNotFound_returns404() {
        ProblemDetail pd = handler.handleNotFound(new UsernameNotFoundException("Usuário não encontrado: x@x.com"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(pd.getDetail()).contains("x@x.com");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:not-found");
        assertThat(pd.getTitle()).isEqualTo("Recurso não encontrado");
    }

    @Test
    @DisplayName("AccessDeniedException deve retornar 403 com tipo problem:forbidden")
    void handleAccessDenied_returns403() {
        ProblemDetail pd = handler.handleAccessDenied(new AccessDeniedException("Access is denied"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.FORBIDDEN.value());
        assertThat(pd.getDetail()).isEqualTo("Acesso negado");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:forbidden");
        assertThat(pd.getTitle()).isEqualTo("Acesso negado");
    }

    @Test
    @DisplayName("Exception genérica deve retornar 500 com tipo problem:internal-error")
    void handleGeneric_returns500() {
        ProblemDetail pd = handler.handleGeneric(new RuntimeException("Unexpected failure"));

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR.value());
        assertThat(pd.getDetail()).contains("erro interno");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:internal-error");
        assertThat(pd.getTitle()).isEqualTo("Erro interno");
    }

    @Test
    @DisplayName("ConstraintViolationException deve retornar 400 com detalhe das violações")
    void handleConstraintViolation_returns400() {
        // Monta uma violação simulada
        ConstraintViolation<?> violation = mock(ConstraintViolation.class);
        jakarta.validation.Path path = mock(jakarta.validation.Path.class);
        when(path.toString()).thenReturn("sync.subjects[0].id");
        when(violation.getPropertyPath()).thenReturn(path);
        when(violation.getMessage()).thenReturn("must not be blank");

        ConstraintViolationException ex = new ConstraintViolationException(
                "sync.subjects[0].id: must not be blank", Set.of(violation));

        ProblemDetail pd = handler.handleConstraintViolation(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getDetail()).contains("must not be blank");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:validation-error");
        assertThat(pd.getTitle()).isEqualTo("Erro de validação");
    }

    @Test
    @DisplayName("MethodArgumentNotValidException deve agregar field errors no detail")
    void handleValidation_aggregatesFieldErrors() {
        BindingResult br = mock(BindingResult.class);
        when(br.getFieldErrors()).thenReturn(List.of(
                new FieldError("obj", "email", "must not be blank"),
                new FieldError("obj", "password", "size must be >= 8")
        ));
        MethodArgumentNotValidException ex = mock(MethodArgumentNotValidException.class);
        when(ex.getBindingResult()).thenReturn(br);

        ProblemDetail pd = handler.handleValidation(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getDetail()).contains("email:", "password:");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:validation-error");
    }

    @Test
    @DisplayName("ResponseStatusException com reason explícito preserva detail")
    void handleResponseStatus_withReason() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.BAD_REQUEST, "boom");

        ProblemDetail pd = handler.handleResponseStatus(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.BAD_REQUEST.value());
        assertThat(pd.getDetail()).isEqualTo("boom");
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:400");
    }

    @Test
    @DisplayName("ResponseStatusException com reason null cai no reasonPhrase do status")
    void handleResponseStatus_nullReason_fallsBackToReasonPhrase() {
        ResponseStatusException ex = new ResponseStatusException(HttpStatus.NOT_FOUND);

        ProblemDetail pd = handler.handleResponseStatus(ex);

        assertThat(pd.getStatus()).isEqualTo(HttpStatus.NOT_FOUND.value());
        assertThat(pd.getDetail()).isEqualTo(HttpStatus.NOT_FOUND.getReasonPhrase());
        assertThat(pd.getType().toString()).isEqualTo("urn:problem:404");
    }
}
