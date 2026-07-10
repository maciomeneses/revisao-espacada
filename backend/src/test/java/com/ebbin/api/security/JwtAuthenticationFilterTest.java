package com.ebbin.api.security;

import com.ebbin.api.service.JwtService;
import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

/**
 * Testes unitários para {@link JwtAuthenticationFilter}.
 *
 * <p>Cobre os branches do {@code doFilterInternal}:
 * <ul>
 *   <li>Sem header Authorization — passa direto</li>
 *   <li>Header sem prefixo Bearer — passa direto</li>
 *   <li>Token válido — autentica e passa</li>
 *   <li>Token válido mas token inválido ({@code isTokenValid} retorna false)</li>
 *   <li>Token válido mas conta desabilitada ({@code isEnabled} retorna false)</li>
 *   <li>email null extraído — não autentica</li>
 *   <li>{@link ExpiredJwtException} — loga e passa</li>
 *   <li>{@link JwtException} — loga e passa</li>
 *   <li>Exception genérica — loga e passa</li>
 * </ul>
 * </p>
 */
@ExtendWith(MockitoExtension.class)
@DisplayName("JwtAuthenticationFilter — testes unitários")
class JwtAuthenticationFilterTest {

    @Mock JwtService jwtService;
    @Mock UserDetailsServiceImpl userDetailsService;

    @InjectMocks JwtAuthenticationFilter filter;

    @BeforeEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    // ---- Sem Authorization header ----

    @Test
    @DisplayName("Requisição sem header Authorization deve passar direto sem autenticar")
    void noAuthHeader_passesThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtService, userDetailsService);
    }

    // ---- Header sem prefixo Bearer ----

    @Test
    @DisplayName("Header Authorization sem prefixo 'Bearer ' deve passar direto")
    void authHeaderWithoutBearerPrefix_passesThrough() throws Exception {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Basic dXNlcjpwYXNz");
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
        verifyNoInteractions(jwtService, userDetailsService);
    }

    // ---- Token válido — autentica ----

    @Test
    @DisplayName("Token JWT válido deve autenticar o usuário no SecurityContext")
    void validToken_authenticatesUser() throws Exception {
        String token = "valid.jwt.token";
        String email = "user@test.com";
        org.springframework.security.core.userdetails.UserDetails userDetails =
                new org.springframework.security.core.userdetails.User(
                        email, "hash", List.of(new SimpleGrantedAuthority("ROLE_USER")));

        when(jwtService.extractEmail(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(userDetails);
        when(jwtService.isTokenValid(token, email)).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNotNull();
        assertThat(SecurityContextHolder.getContext().getAuthentication().getName()).isEqualTo(email);
    }

    // ---- Token válido mas conta desabilitada ----

    @Test
    @DisplayName("Usuário desabilitado (e-mail não confirmado) com token válido não deve autenticar")
    void validTokenDisabledUser_doesNotAuthenticate() throws Exception {
        // given: conta com enabled=false (e-mail de self-signup ainda não confirmado)
        String token = "valid.jwt.token";
        String email = "disabled@test.com";
        org.springframework.security.core.userdetails.UserDetails userDetails =
                new org.springframework.security.core.userdetails.User(
                        email, "hash", false, true, true, true,
                        List.of(new SimpleGrantedAuthority("ROLE_USER")));

        when(jwtService.extractEmail(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(userDetails);
        when(jwtService.isTokenValid(token, email)).thenReturn(true);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        // when
        filter.doFilter(request, response, chain);

        // then: chain continua, mas o SecurityContext permanece sem autenticação
        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // ---- Token presente mas isTokenValid retorna false ----

    @Test
    @DisplayName("Token inválido (isTokenValid=false) não deve autenticar")
    void invalidToken_doesNotAuthenticate() throws Exception {
        String token = "bad.jwt.token";
        String email = "user@test.com";
        org.springframework.security.core.userdetails.UserDetails userDetails =
                new org.springframework.security.core.userdetails.User(
                        email, "hash", List.of(new SimpleGrantedAuthority("ROLE_USER")));

        when(jwtService.extractEmail(token)).thenReturn(email);
        when(userDetailsService.loadUserByUsername(email)).thenReturn(userDetails);
        when(jwtService.isTokenValid(token, email)).thenReturn(false);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // ---- Email null extraído ----

    @Test
    @DisplayName("Token com email null extraído não deve chamar userDetailsService")
    void nullEmail_doesNotAuthenticate() throws Exception {
        String token = "token.with.null.email";
        when(jwtService.extractEmail(token)).thenReturn(null);

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(userDetailsService);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // ---- ExpiredJwtException ----

    @Test
    @DisplayName("ExpiredJwtException deve ser capturada sem propagar e chain deve continuar")
    void expiredToken_logsAndPassesThrough() throws Exception {
        String token = "expired.jwt.token";
        when(jwtService.extractEmail(token)).thenThrow(
                new ExpiredJwtException(null, null, "Token expired"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // ---- JwtException genérica ----

    @Test
    @DisplayName("JwtException (não expirado) deve ser capturada e chain deve continuar")
    void jwtException_logsAndPassesThrough() throws Exception {
        String token = "malformed.jwt.token";
        when(jwtService.extractEmail(token)).thenThrow(new JwtException("Invalid signature"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // ---- Exception genérica ----

    @Test
    @DisplayName("Exception inesperada deve ser capturada e chain deve continuar")
    void genericException_logsAndPassesThrough() throws Exception {
        String token = "some.jwt.token";
        when(jwtService.extractEmail(token)).thenThrow(new RuntimeException("Unexpected error"));

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }

    // ---- Contexto já autenticado — não reautentica ----

    @Test
    @DisplayName("Quando SecurityContext já tem autenticação não deve chamar userDetailsService")
    void alreadyAuthenticated_doesNotReauthenticate() throws Exception {
        String token = "valid.jwt.token";
        String email = "user@test.com";

        // Pré-popula o SecurityContext com uma autenticação existente
        org.springframework.security.core.userdetails.UserDetails existingUser =
                new org.springframework.security.core.userdetails.User(
                        email, "hash", List.of(new SimpleGrantedAuthority("ROLE_USER")));
        var existingAuth = new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
                existingUser, null, existingUser.getAuthorities());
        SecurityContextHolder.getContext().setAuthentication(existingAuth);

        when(jwtService.extractEmail(token)).thenReturn(email);
        // SecurityContextHolder já tem auth — não deve chamar loadUserByUsername

        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/subjects");
        request.addHeader("Authorization", "Bearer " + token);
        MockHttpServletResponse response = new MockHttpServletResponse();
        FilterChain chain = mock(FilterChain.class);

        filter.doFilter(request, response, chain);

        verify(chain).doFilter(request, response);
        verifyNoInteractions(userDetailsService);
    }
}
