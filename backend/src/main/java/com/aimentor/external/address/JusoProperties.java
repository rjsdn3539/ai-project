package com.aimentor.external.address;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "integration.juso")
public record JusoProperties(
        String baseUrl,
        String apiKey
) {
}
