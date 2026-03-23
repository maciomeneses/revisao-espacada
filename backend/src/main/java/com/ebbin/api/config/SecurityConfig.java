package com.ebbin.api.config;

import com.ebbin.api.security.EndpointRateLimitFilter;
import com.ebbin.api.security.JwtAuthenticationFilter;
import com.ebbin.api.security.MdcRequestFilter;
import com.ebbin.api.security.UserDetailsServiceImpl;
import jakarta.servlet.http.HttpServletResponse;
import tools.jackson.databind.json.JsonMapper;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.web.header.writers.ReferrerPolicyHeaderWriter;

import java.util.Map;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtFilter;
    private final EndpointRateLimitFilter rateLimitFilter;
    private final MdcRequestFilter mdcFilter;
    private final UserDetailsServiceImpl userDetailsService;
    private final JsonMapper jsonMapper;

    public SecurityConfig(JwtAuthenticationFilter jwtFilter,
                          EndpointRateLimitFilter rateLimitFilter,
                          MdcRequestFilter mdcFilter,
                          UserDetailsServiceImpl userDetailsService,
                          JsonMapper jsonMapper) {
        this.jwtFilter = jwtFilter;
        this.rateLimitFilter = rateLimitFilter;
        this.mdcFilter = mdcFilter;
        this.userDetailsService = userDetailsService;
        this.jsonMapper = jsonMapper;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                // ---- HTTP Security Headers (OWASP A05 — Security Misconfiguration) ----
                .headers(headers -> headers
                        // X-Content-Type-Options: nosniff — previne MIME-type sniffing
                        .contentTypeOptions(Customizer.withDefaults())
                        // X-Frame-Options: DENY — previne clickjacking
                        .frameOptions(frame -> frame.deny())
                        // Strict-Transport-Security — força HTTPS (max-age 1 ano + subdomains)
                        .httpStrictTransportSecurity(hsts -> hsts
                                .includeSubDomains(true)
                                .maxAgeInSeconds(31536000))
                        // Content-Security-Policy — restringe origens de recursos
                        .contentSecurityPolicy(csp -> csp
                                .policyDirectives(
                                        "default-src 'none'; " +
                                        "script-src 'self'; " +
                                        "style-src 'self'; " +
                                        "img-src 'self' data:; " +
                                        "connect-src 'self'; " +
                                        "frame-ancestors 'none'"))
                        // Referrer-Policy — limita informações no cabeçalho Referer
                        .referrerPolicy(referrer -> referrer
                                .policy(ReferrerPolicyHeaderWriter.ReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN))
                        // Permissions-Policy — desabilita APIs de browser não utilizadas
                        .permissionsPolicy(permissions -> permissions
                                .policy("camera=(), microphone=(), geolocation=(), payment=()")))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // /actuator/health é público (liveness probe de infra/load balancer).
                        // Qualquer outro endpoint do actuator requer autenticação para evitar
                        // vazamento de informações internas (OWASP A05 — Security Misconfiguration).
                        .requestMatchers("/actuator/health").permitAll()
                        .requestMatchers("/actuator/**").authenticated()
                        // Defesa em profundidade: restrição no nível de URL além do @PreAuthorize
                        // (OWASP A01 — Broken Access Control). Garante que o accessDeniedHandler
                        // RFC 9457 é acionado mesmo em contextos onde o @ControllerAdvice não atua.
                        .requestMatchers("/api/admin/**").hasRole("ADMIN")
                        .anyRequest().authenticated())
                // ---- RFC 9457 para respostas 401/403 do Spring Security ----
                .exceptionHandling(ex -> ex
                        // 401 — token ausente ou inválido (não autenticado)
                        .authenticationEntryPoint((request, response, authException) -> {
                            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write(jsonMapper.writeValueAsString(Map.of(
                                    "type",   "urn:problem:unauthorized",
                                    "title",  "Não autorizado",
                                    "status", 401,
                                    "detail", "Autenticação necessária. Forneça um token JWT válido.")));
                        })
                        // 403 — autenticado mas sem permissão (acesso negado)
                        .accessDeniedHandler((request, response, accessDeniedException) -> {
                            response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                            response.setCharacterEncoding("UTF-8");
                            response.getWriter().write(jsonMapper.writeValueAsString(Map.of(
                                    "type",   "urn:problem:forbidden",
                                    "title",  "Acesso negado",
                                    "status", 403,
                                    "detail", "Acesso negado. Você não tem permissão para acessar este recurso.")));
                        }))
                .authenticationProvider(authenticationProvider())
                // MDC deve ser o primeiro filtro para garantir requestId em todos os logs
                .addFilterBefore(mdcFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(rateLimitFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)
                .build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        var provider = new DaoAuthenticationProvider(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
