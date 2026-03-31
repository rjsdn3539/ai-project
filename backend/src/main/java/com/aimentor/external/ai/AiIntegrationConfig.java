package com.aimentor.external.ai;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import tools.jackson.databind.ObjectMapper;

@Configuration
public class AiIntegrationConfig {

    @Bean
    @Primary
    @ConditionalOnProperty(name = "integration.ai.provider", havingValue = "python-ai")
    public AiIntegrationService httpAiIntegrationService(AiIntegrationProperties properties, ObjectMapper objectMapper) {
        return new HttpAiIntegrationService(properties.baseUrl(), objectMapper);
    }
}
