package com.ebbin.api.security;

import com.ebbin.api.config.RateLimitProperties;
import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Filtro de rate limiting para o endpoint de login ({@code POST /api/auth/login}).
 *
 * <p>Utiliza o algoritmo <em>token bucket</em> do Bucket4j com um bucket por IP de origem.
 * Limite padrão: 5 requisições por minuto por IP (configurável via {@code app.rate-limit.login.*}).
 * Requisições que excedem o limite recebem HTTP 429 com corpo RFC 9457.</p>
 *
 * <p>Mitigação OWASP A07 — Identification and Authentication Failures (brute force).</p>
 */
@Component
public class LoginRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(LoginRateLimitFilter.class);
    private static final String LOGIN_PATH = "/api/auth/login";
    private static final String POST = "POST";

    private final ConcurrentHashMap<String, Bucket> buckets = new ConcurrentHashMap<>();
    private final RateLimitProperties props;

    public LoginRateLimitFilter(RateLimitProperties props) {
        this.props = props;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        if (!isLoginRequest(request)) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        Bucket bucket = buckets.computeIfAbsent(clientIp, this::newBucket);

        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit excedido no login: ip={}", clientIp);
            response.setStatus(429);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.setCharacterEncoding("UTF-8");
            response.getWriter().write("""
                    {"type":"urn:problem:too-many-requests","title":"Muitas tentativas","status":429,\
                    "detail":"Limite de tentativas de login atingido. Aguarde um momento e tente novamente."}
                    """);
        }
    }

    private boolean isLoginRequest(HttpServletRequest request) {
        if (!POST.equalsIgnoreCase(request.getMethod())) return false;
        // getServletPath() pode retornar vazio em algumas configurações de MockMvc;
        // por isso também verificamos getRequestURI() para compatibilidade.
        String path = request.getServletPath();
        if (path == null || path.isBlank()) {
            path = request.getRequestURI();
        }
        return LOGIN_PATH.equals(path);
    }

    private Bucket newBucket(String ip) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(props.getCapacity())
                .refillIntervally(props.getRefillTokens(), Duration.ofMinutes(props.getRefillMinutes()))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    /**
     * Resolve o IP real do cliente, respeitando proxies reversos via X-Forwarded-For.
     */
    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
