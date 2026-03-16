package com.ebbin.api.config;

import com.ebbin.api.model.User;
import com.ebbin.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class AdminInitializer {

    @Bean
    CommandLineRunner initAdmin(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            if (userRepository.findByEmail("admin@ebbin.com").isEmpty()) {
                User admin = new User();
                admin.setEmail("admin@ebbin.com");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setRole(User.Role.ADMIN);
                userRepository.save(admin);
                System.out.println("Usuário administrador inicial criado: admin@ebbin.com / admin123");
            }
        };
    }
}
