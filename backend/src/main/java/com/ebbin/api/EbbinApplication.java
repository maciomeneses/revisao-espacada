package com.ebbin.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class EbbinApplication {

    public static void main(String[] args) {
        SpringApplication.run(EbbinApplication.class, args);
    }
}
