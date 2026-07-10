package com.ebbin.api.service;

import com.ebbin.api.dto.UserDto;
import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class UserService {

    private static final Logger log = LoggerFactory.getLogger(UserService.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserDto> findAll() {
        List<UserDto> users = userRepository.findAll().stream()
                .map(UserDto::from)
                .toList();
        log.debug("findAll: count={}", users.size());
        return users;
    }

    @Transactional
    public UserDto createUser(UserDto dto) {
        log.info("Criando usuário via admin: email={}, role={}", dto.email(), dto.role());
        if (dto.password() == null || dto.password().isBlank()) {
            throw new IllegalArgumentException("Senha é obrigatória para criação de usuário");
        }
        if (userRepository.existsByEmail(dto.email())) {
            log.warn("Tentativa de criar usuário com e-mail duplicado: {}", dto.email());
            throw new IllegalArgumentException("E-mail já cadastrado");
        }
        User user = new User();
        user.setEmail(dto.email());
        user.setPassword(passwordEncoder.encode(dto.password()));
        user.setRole(dto.role() != null ? dto.role() : User.Role.USER);
        UserDto result = UserDto.from(userRepository.save(user));
        log.info("Usuário criado via admin: id={}, email={}", result.id(), result.email());
        return result;
    }

    @Transactional
    public UserDto updateUser(UUID id, UserDto dto) {
        log.info("Atualizando usuário: id={}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + id));

        if (!user.getEmail().equals(dto.email()) && userRepository.existsByEmail(dto.email())) {
            log.warn("Tentativa de atualizar usuário {} para e-mail já cadastrado", id);
            throw new IllegalArgumentException("E-mail já cadastrado");
        }
        if (user.getRole() == User.Role.ADMIN && dto.role() == User.Role.USER && isLastAdmin()) {
            log.warn("Tentativa de rebaixar o único ADMIN: id={}", id);
            throw new IllegalArgumentException("Não é possível rebaixar o único ADMIN do sistema");
        }

        user.setEmail(dto.email());
        if (dto.password() != null && !dto.password().isBlank()) {
            user.setPassword(passwordEncoder.encode(dto.password()));
        }
        if (dto.role() != null) {
            user.setRole(dto.role());
        }
        UserDto result = UserDto.from(userRepository.save(user));
        log.info("Usuário atualizado: id={}, email={}", result.id(), result.email());
        return result;
    }

    @Transactional
    public void deleteUser(UUID id) {
        log.warn("Removendo usuário: id={}", id);
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UsernameNotFoundException("Usuário não encontrado: " + id));
        if (user.getRole() == User.Role.ADMIN && isLastAdmin()) {
            log.warn("Tentativa de remover o único ADMIN: id={}", id);
            throw new IllegalArgumentException("Não é possível remover o único ADMIN do sistema");
        }
        userRepository.delete(user);
        log.info("Usuário removido: id={}", id);
    }

    /** {@code true} quando existe exatamente um usuário com papel ADMIN. */
    private boolean isLastAdmin() {
        return userRepository.countByRole(User.Role.ADMIN) == 1;
    }
}
