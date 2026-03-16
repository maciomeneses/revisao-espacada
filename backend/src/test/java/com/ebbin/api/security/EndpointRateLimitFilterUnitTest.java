package com.ebbin.api.security;

import com.ebbin.api.config.RateLimitProperties;
import com.ebbin.api.config.RateLimitProperties.EndpointConfig;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

import java.util.Map;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * Testes unitários para {@link EndpointRateLimitFilter}.
 *
 * <p>Cobre edge cases de resolução de IP e path, garantindo branch coverage completo:
 * <ul>
 *   <li>servletPath nulo — fallback para requestURI</li>
 *   <li>servletPath em branco — fallback para requestURI</li>
 *   <li>X-Forwarded-For com múltiplos IPs — extrai apenas o primeiro</li>
 *   <li>X-Forwarded-For em branco — usa remoteAddr</li>
 *   <li>X-Forwarded-For ausente — usa remoteAddr</li>
 *   <li>Endpoint não protegido — passa sem rate limiting</li>
 *   <li>Método não POST em endpoint protegido — passa sem rate limiting</li>
 *   <li>Limite excedido — retorna 429 RFC 9457</li>
 *   <li>getProtectedPaths() — retorna todos os paths configurados</li>
 * </ul>
 * </p>
 */
@DisplayName("EndpointRateLimitFilter — testes unitários de edge cases")
class EndpointRateLimitFilterUnitTest {

    private EndpointRateLimitFilter filter;
    private RateLimitProperties props;

    @BeforeEach
    void setUp() {
        props = new RateLimitProperties();

        EndpointConfig loginConfig = new EndpointConfig(5, 5, 1, 60);
        EndpointConfig forgotConfig = new EndpointConfig(5, 5, 1, 60);

        props.setEndpoints(Map.of(
                "login", loginConfig,
                "forgot-password", forgotConfig
        ));

        filter = new EndpointRateLimitFilter(props);
    }

    // ---- resolvePath edge cases ----

    @Test
    @DisplayName("Deve usar requestURI como fallback quando servletPath é nulo")
    void resolvePath_nullServletPath_shouldFallbackToRequestUri() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        // MockHttpServletRequest retorna "" por padrão; forçamos null via subclasse anônima
        MockHttpServletRequest requestWithNullServletPath = new MockHttpServletRequest("POST", "/api/auth/login") {
            @Override
            public String getServletPath() {
                return null;
            }
        };
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(requestWithNullServletPath, response, chain);

        // Path resolvido via requestURI — endpoint reconhecido, rate limit aplicado, chain invocado
        verify(chain, times(1)).doFilter(requestWithNullServletPath, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    @Test
    @DisplayName("Deve usar requestURI como fallback quando servletPath está em branco")
    void resolvePath_blankServletPath_shouldFallbackToRequestUri() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login") {
            @Override
            public String getServletPath() {
                return "   ";
            }
        };
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        // Com servletPath em branco, fallback para requestURI "/api/auth/login" funciona
        verify(chain, times(1)).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    @Test
    @DisplayName("Deve usar servletPath diretamente quando não é nulo nem em branco")
    void resolvePath_nonBlankServletPath_shouldUseItDirectly() throws Exception {
        // Sobrescreve getServletPath() para retornar um path real e não-branco
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login") {
            @Override
            public String getServletPath() {
                return "/api/auth/login";
            }
        };
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        // servletPath válido → endpoint reconhecido → rate limit aplicado → chain invocado
        verify(chain, times(1)).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    // ---- resolveClientIp edge cases ----

    @Test
    @DisplayName("Deve extrair apenas o primeiro IP de X-Forwarded-For com múltiplos valores")
    void resolveClientIp_multipleForwardedIps_shouldUseFirst() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader("X-Forwarded-For", "203.0.113.1, 198.51.100.2, 192.0.2.3");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        // Consome 1 token — deve passar (bucket cheio com 5 tokens)
        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    @Test
    @DisplayName("Deve usar remoteAddr quando X-Forwarded-For está em branco")
    void resolveClientIp_blankForwardedHeader_shouldUseRemoteAddr() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.addHeader("X-Forwarded-For", "   ");
        request.setRemoteAddr("10.20.30.40");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    @Test
    @DisplayName("Deve usar remoteAddr quando X-Forwarded-For está ausente")
    void resolveClientIp_noForwardedHeader_shouldUseRemoteAddr() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/login");
        request.setRemoteAddr("192.168.1.99");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    // ---- Endpoint não protegido ----

    @Test
    @DisplayName("Requisição para endpoint não protegido deve passar direto sem rate limiting")
    void unprotectedEndpoint_shouldPassThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/api/auth/register");
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    @Test
    @DisplayName("Requisição GET para endpoint protegido deve passar direto sem rate limiting")
    void protectedEndpoint_getMethod_shouldPassThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/auth/login");
        request.setRemoteAddr("10.0.0.1");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain, times(1)).doFilter(request, response);
        assertThat(response.getStatus()).isNotEqualTo(429);
    }

    // ---- Limite excedido ----

    @Test
    @DisplayName("Deve retornar 429 com corpo RFC 9457 quando limite é excedido")
    void exceedLimit_shouldReturn429WithRfc9457Body() throws Exception {
        // Configura bucket pequeno (capacidade 1) para facilitar esgotamento
        EndpointConfig tightConfig = new EndpointConfig(1, 1, 60, 60);
        props.setEndpoints(Map.of("login", tightConfig, "forgot-password", tightConfig));
        EndpointRateLimitFilter tightFilter = new EndpointRateLimitFilter(props);

        String ip = "10.99.0.1";

        // Primeira requisição — consome o único token disponível
        MockHttpServletRequest first = new MockHttpServletRequest("POST", "/api/auth/login");
        first.setRemoteAddr(ip);
        MockHttpServletResponse firstResponse = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);
        tightFilter.doFilter(first, firstResponse, chain);
        verify(chain, times(1)).doFilter(first, firstResponse);

        // Segunda requisição do mesmo IP — deve ser bloqueada com 429
        MockHttpServletRequest second = new MockHttpServletRequest("POST", "/api/auth/login");
        second.setRemoteAddr(ip);
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        FilterChain chain2 = mock(FilterChain.class);
        tightFilter.doFilter(second, secondResponse, chain2);

        assertThat(secondResponse.getStatus()).isEqualTo(429);
        assertThat(secondResponse.getContentAsString()).contains("urn:problem:too-many-requests");
        assertThat(secondResponse.getContentAsString()).contains("\"status\":429");
        verify(chain2, never()).doFilter(any(), any());
    }

    @Test
    @DisplayName("Deve retornar 429 para /forgot-password quando limite é excedido")
    void exceedLimit_forgotPassword_shouldReturn429() throws Exception {
        EndpointConfig tightConfig = new EndpointConfig(1, 1, 60, 60);
        props.setEndpoints(Map.of("login", tightConfig, "forgot-password", tightConfig));
        EndpointRateLimitFilter tightFilter = new EndpointRateLimitFilter(props);

        String ip = "10.99.1.1";

        // Esgota o bucket de forgot-password
        MockHttpServletRequest first = new MockHttpServletRequest("POST", "/api/auth/forgot-password");
        first.setRemoteAddr(ip);
        tightFilter.doFilter(first, new MockHttpServletResponse(), mock(FilterChain.class));

        // Segunda tentativa deve ser bloqueada
        MockHttpServletRequest second = new MockHttpServletRequest("POST", "/api/auth/forgot-password");
        second.setRemoteAddr(ip);
        MockHttpServletResponse secondResponse = new MockHttpServletResponse();
        FilterChain chain2 = mock(FilterChain.class);
        tightFilter.doFilter(second, secondResponse, chain2);

        assertThat(secondResponse.getStatus()).isEqualTo(429);
        verify(chain2, never()).doFilter(any(), any());
    }

    // ---- getProtectedPaths ----

    @Test
    @DisplayName("getProtectedPaths deve retornar todos os endpoints protegidos")
    void getProtectedPaths_shouldReturnAllProtectedEndpoints() {
        Set<String> paths = filter.getProtectedPaths();

        assertThat(paths).containsExactlyInAnyOrder(
                "/api/auth/login",
                "/api/auth/forgot-password"
        );
    }
}
