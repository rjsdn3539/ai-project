package com.aimentor.domain.learning.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.Map;

public record UpsertLearningProgressRequest(
        @NotBlank String subject,
        @NotBlank String difficulty,
        @NotNull @Min(1) Integer count,
        @NotNull @Min(0) Integer currentIdx,
        List<Map<String, Object>> problems,
        Map<String, Object> userAnswers,
        Map<String, Object> results
) {
}