package com.aimentor;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class AiMentorApplication {
    public static void main(String[] args) {
        SpringApplication.run(AiMentorApplication.class, args);
    }
}
