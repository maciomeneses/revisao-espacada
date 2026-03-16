package com.ebbin.api.exception;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.net.URI;
import java.util.stream.Collectors;

/**
 * Centraliza o tratamento de exceções da API, padronizando respostas de erro
 * no formato RFC 9457 (Problem Details for HTTP APIs) via ProblemDetail.
 * Previne o vazamento de stack traces para o cliente (OWASP A05).
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    /** Erros de validação de Bean Validation (@Valid) */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ProblemDetail handleValidation(MethodArgumentNotValidException ex) {
        String detail = ex.getBindingResult().getFieldErrors().stream()
                .map(fe -> fe.getField() + ": " + fe.getDefaultMessage())
                .collect(Collectors.joining("; "));
        log.debug("Validação falhou: {}", detail);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail);
        pd.setType(URI.create("urn:problem:validation-error"));
        pd.setTitle("Erro de validação");
        return pd;
    }

    /** E-mail duplicado no cadastro */
    @ExceptionHandler(IllegalArgumentException.class)
    public ProblemDetail handleIllegalArgument(IllegalArgumentException ex) {
        log.debug("Argumento inválido: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, ex.getMessage());
        pd.setType(URI.create("urn:problem:conflict"));
        pd.setTitle("Conflito de dados");
        return pd;
    }

    /** Credenciais inválidas no login */
    @ExceptionHandler(BadCredentialsException.class)
    public ProblemDetail handleBadCredentials(BadCredentialsException ex) {
        log.warn("Tentativa de login com credenciais inválidas");
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Credenciais inválidas");
        pd.setType(URI.create("urn:problem:unauthorized"));
        pd.setTitle("Não autorizado");
        return pd;
    }

    /** Recurso não encontrado */
    @ExceptionHandler(UsernameNotFoundException.class)
    public ProblemDetail handleNotFound(UsernameNotFoundException ex) {
        log.debug("Recurso não encontrado: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setType(URI.create("urn:problem:not-found"));
        pd.setTitle("Recurso não encontrado");
        return pd;
    }

    /** Acesso negado (403) */
    @ExceptionHandler(AccessDeniedException.class)
    public ProblemDetail handleAccessDenied(AccessDeniedException ex) {
        log.warn("Acesso negado: {}", ex.getMessage());
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Acesso negado");
        pd.setType(URI.create("urn:problem:forbidden"));
        pd.setTitle("Acesso negado");
        return pd;
    }

    /** Fallback para erros não mapeados — evita stack trace exposto (OWASP A05) */
    @ExceptionHandler(Exception.class)
    public ProblemDetail handleGeneric(Exception ex) {
        log.error("Erro interno não tratado: {}", ex.getMessage(), ex);
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
                HttpStatus.INTERNAL_SERVER_ERROR,
                "Ocorreu um erro interno. Consulte os logs para detalhes.");
        pd.setType(URI.create("urn:problem:internal-error"));
        pd.setTitle("Erro interno");
        return pd;
    }
}
