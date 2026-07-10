package com.ebbin.api.security;

import com.ebbin.api.config.RateLimitProperties;
import com.ebbin.api.config.RateLimitProperties.EndpointConfig;
import com.github.benmanes.caffeine.cache.Cache;
import com.github.benmanes.caffeine.cache.Caffeine;
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
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;

/**
 * Filtro de rate limiting multi-endpoint baseado em token bucket (Bucket4j).
 *
 * <p>Protege endpoints sensíveis contra abuso (brute-force, flooding), com um bucket
 * independente por IP e por endpoint. Os buckets são armazenados em um
 * {@link Cache Caffeine cache} com TTL configurável, garantindo eviction automática de
 * entradas inativas e prevenindo crescimento ilimitado de memória — solução para a
 * vulnerabilidade do {@code ConcurrentHashMap} utilizado anteriormente.</p>
 *
 * <h3>Endpoints protegidos</h3>
 * <ul>
 *   <li>{@code POST /api/auth/login} — proteção contra brute-force de credenciais</li>
 *   <li>{@code POST /api/auth/forgot-password} — proteção contra abuso do fluxo de reset de senha</li>
 * </ul>
 *
 * <h3>Configuração</h3>
 * <p>Cada endpoint é configurado via {@code app.rate-limit.endpoints.<key>.*} no
 * {@code application.yml}. O fallback para os valores legados {@code app.rate-limit.login.*}
 * é mantido para retrocompatibilidade.</p>
 *
 * <p>Mitigação OWASP A07 — Identification and Authentication Failures (brute force).</p>
 */
@Component
public class EndpointRateLimitFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(EndpointRateLimitFilter.class);

    /** Mapeamento de path protegido → chave de configuração no RateLimitProperties. */
    private static final Map<String, String> PROTECTED_PATHS = Map.of(
            "/api/auth/login",           "login",
            "/api/auth/forgot-password", "forgot-password",
            "/api/auth/reset-password",  "reset-password",
            "/api/auth/signup",          "signup",
            "/api/auth/verify-email",    "verify-email"
    );

    private static final String POST = "POST";

    /**
     * Cache de caches: chave externa = endpointKey, cache interno = ip → Bucket.
     * Cada endpoint tem seu próprio Caffeine cache com TTL independente.
     */
    private final ConcurrentHashMap<String, Cache<String, Bucket>> bucketCaches = new ConcurrentHashMap<>();

    private final RateLimitProperties props;

    public EndpointRateLimitFilter(RateLimitProperties props) {
        this.props = props;
    }

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain filterChain)
            throws ServletException, IOException {

        String path = resolvePath(request);
        String endpointKey = PROTECTED_PATHS.get(path);

        if (endpointKey == null || !POST.equalsIgnoreCase(request.getMethod())) {
            filterChain.doFilter(request, response);
            return;
        }

        String clientIp = resolveClientIp(request);
        EndpointConfig config = props.getEndpointConfig(endpointKey);
        Cache<String, Bucket> cache = bucketCaches.computeIfAbsent(endpointKey,
                k -> buildCache(config));

        Bucket bucket = cache.get(clientIp, ip -> newBucket(config));

        // newBucket() nunca retorna null; o cast de segurança abaixo é garantido pelo loader
        if (bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit excedido: endpoint={}, ip={}", endpointKey, clientIp);
            writeTooManyRequests(response);
        }
    }

    /**
     * Constrói um Caffeine cache com TTL baseado na configuração do endpoint.
     * A eviction após {@code ttlMinutes} de inatividade garante que IPs que param de
     * fazer requisições tenham seus buckets removidos automaticamente da memória.
     */
    private Cache<String, Bucket> buildCache(EndpointConfig config) {
        return Caffeine.newBuilder()
                .expireAfterAccess(config.getTtlMinutes(), TimeUnit.MINUTES)
                .build();
    }

    private Bucket newBucket(EndpointConfig config) {
        Bandwidth limit = Bandwidth.builder()
                .capacity(config.getCapacity())
                .refillIntervally(config.getRefillTokens(), Duration.ofMinutes(config.getRefillMinutes()))
                .build();
        return Bucket.builder().addLimit(limit).build();
    }

    private void writeTooManyRequests(HttpServletResponse response) throws IOException {
        response.setStatus(429);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write("""
                {"type":"urn:problem:too-many-requests","title":"Muitas tentativas","status":429,\
                "detail":"Limite de requisições atingido. Aguarde um momento e tente novamente."}
                """);
    }

    /**
     * Resolve o path da requisição, com fallback para URI para compatibilidade com MockMvc.
     */
    private String resolvePath(HttpServletRequest request) {
        String path = request.getServletPath();
        if (path == null || path.isBlank()) {
            path = request.getRequestURI();
        }
        return path;
    }

    /**
     * Resolve o IP real do cliente para chavear o bucket de rate limit.
     *
     * <p><b>Caminho recomendado (PaaS/Railway) — {@code forwarded-for-trusted-hops > 0}:</b>
     * confia num número fixo de proxies de borda e usa o IP que o proxy <em>anexou</em> ao
     * {@code X-Forwarded-For} — o {@code hops}-ésimo a contar da direita. Esse valor não é
     * forjável: qualquer {@code XFF} que o cliente envie fica à <em>esquerda</em> do IP real
     * anexado pela borda. Ex.: cliente forja {@code "9.9.9.9"}; a borda anexa o IP real
     * {@code R} → app recebe {@code "9.9.9.9, R"}; com {@code hops=1} pegamos {@code R}.</p>
     *
     * <p><b>Caminho legado — {@code trusted-proxies} (casamento de IP exato):</b> usado apenas
     * quando {@code hops == 0} e a lista não está vazia. Lê o IP mais à esquerda do
     * {@code XFF} (forjável — por isso o caminho por hops é preferível atrás de proxy).</p>
     *
     * <p><b>Padrão seguro:</b> {@code hops == 0} e {@code trusted-proxies} vazio → o header é
     * ignorado e o {@code remoteAddr} (conexão TCP) é usado.</p>
     */
    String resolveClientIp(HttpServletRequest request) {
        String remoteAddr = request.getRemoteAddr();

        int hops = props.getForwardedForTrustedHops();
        if (hops > 0) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                String[] parts = forwarded.split(",");
                int idx = parts.length - hops;
                if (idx >= 0) {
                    String ip = parts[idx].trim();
                    if (!ip.isEmpty()) {
                        log.debug("Rate limit — IP do cliente via {} hop(s) confiável(is): {} (XFF={})",
                                hops, ip, forwarded);
                        return ip;
                    }
                }
                // Menos entradas no XFF do que hops confiáveis → configuração incoerente.
                // Postura segura: cai para remoteAddr em vez de confiar num índice inválido.
                log.warn("X-Forwarded-For incompatível com trusted-hops={} (XFF={}); usando remoteAddr",
                        hops, forwarded);
            }
            return remoteAddr;
        }

        boolean isTrustedProxy = !props.getTrustedProxies().isEmpty()
                && props.getTrustedProxies().contains(remoteAddr);
        if (isTrustedProxy) {
            String forwarded = request.getHeader("X-Forwarded-For");
            if (forwarded != null && !forwarded.isBlank()) {
                return forwarded.split(",")[0].trim();
            }
        }
        return remoteAddr;
    }

    /**
     * Retorna o conjunto de paths protegidos por este filtro (visível para testes).
     */
    Set<String> getProtectedPaths() {
        return PROTECTED_PATHS.keySet();
    }
}
