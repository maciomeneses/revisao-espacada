package com.ebbin.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Filtro de infraestrutura que injeta um {@code requestId} único no MDC (Mapped Diagnostic Context)
 * do SLF4J no início de cada requisição HTTP, garantindo rastreabilidade total nos logs.
 *
 * <p>O {@code requestId} pode ser fornecido pelo cliente via header {@code X-Request-ID}
 * (útil para correlação entre frontend e backend) ou gerado automaticamente com UUID v4.
 * O valor é propagado para todos os logs emitidos durante o ciclo de vida da requisição e
 * incluído na resposta via header {@code X-Request-ID} para facilitar debugging no cliente.</p>
 *
 * <p>O MDC é limpo (via {@code finally}) ao final de cada requisição para evitar vazamentos
 * entre threads em ambientes com pool de threads (inclui Virtual Threads do Java 21+).</p>
 */
@Component
public class MdcRequestFilter extends OncePerRequestFilter {

    private static final String REQUEST_ID_HEADER = "X-Request-ID";
    private static final String MDC_KEY = "requestId";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String requestId = resolveRequestId(request);
        MDC.put(MDC_KEY, requestId);
        response.setHeader(REQUEST_ID_HEADER, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    /**
     * Resolve o requestId: reutiliza o header {@code X-Request-ID} se válido (máx. 64 chars),
     * caso contrário gera um UUID v4.
     */
    private String resolveRequestId(HttpServletRequest request) {
        String incoming = request.getHeader(REQUEST_ID_HEADER);
        if (incoming != null && !incoming.isBlank() && incoming.length() <= 64) {
            return incoming.trim();
        }
        return UUID.randomUUID().toString();
    }
}
