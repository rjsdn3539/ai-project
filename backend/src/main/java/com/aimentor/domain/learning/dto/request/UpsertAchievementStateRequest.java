package com.aimentor.domain.learning.dto.request;

import jakarta.validation.constraints.NotNull;
import java.util.Map;

public record UpsertAchievementStateRequest(
        @NotNull Map<String, Object> stats
) {
}