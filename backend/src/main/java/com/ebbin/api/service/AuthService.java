package com.ebbin.api.service;

import com.ebbin.api.dto.LoginRequest;
import com.ebbin.api.dto.LoginResponse;
import com.ebbin.api.dto.RegisterRequest;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                       JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    public LoginResponse login(LoginRequest req) {
        log.info("Tentativa de login: email={}", req.email());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(req.email(), req.password()));

        User user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + req.email()));

        String token = jwtService.generateToken(user.getEmail());
        log.info("Login bem-sucedido: email={}, role={}", user.getEmail(), user.getRole());
        return LoginResponse.of(token, user);
    }

    public LoginResponse register(RegisterRequest req) {
        log.info("Cadastro de usuário: email={}, role={}", req.email(), req.role());
        if (userRepository.existsByEmail(req.email())) {
            log.warn("Tentativa de cadastro com e-mail duplicado: {}", req.email());
            throw new IllegalArgumentException("E-mail já cadastrado");
        }

        User user = new User();
        user.setEmail(req.email());
        user.setPassword(passwordEncoder.encode(req.password()));
        user.setRole(req.role());
        userRepository.save(user);

        log.info("Usuário criado com sucesso: email={}, role={}", user.getEmail(), user.getRole());
        String token = jwtService.generateToken(user.getEmail());
        return LoginResponse.of(token, user);
    }
}
