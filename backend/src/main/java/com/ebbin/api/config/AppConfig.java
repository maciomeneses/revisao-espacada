package com.ebbin.api.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

/**
 * Configuração de beans de infraestrutura geral da aplicação.
 *
 * <p>Centraliza beans utilitários que precisam ser injetáveis em múltiplos serviços,
 * facilitando a substituição por implementações alternativas nos testes (e.g., relógio
 * fixo via {@link Clock#fixed} para testes determinísticos).</p>
 */
@Configuration
public class AppConfig {

    /**
     * Bean de relógio do sistema, injetado em serviços que precisam de {@code LocalDate.now()}.
     *
     * <p>Usar {@link Clock} em vez de chamar {@code LocalDate.now()} diretamente permite
     * que os testes substituam o bean por um relógio fixo ({@link Clock#fixed}), tornando
     * os testes de lógica temporal 100% determinísticos e independentes do horário de execução.</p>
     *
     * @return {@link Clock#systemDefaultZone()} para uso em produção
     */
    @Bean
    public Clock clock() {
        return Clock.systemDefaultZone();
    }
}
