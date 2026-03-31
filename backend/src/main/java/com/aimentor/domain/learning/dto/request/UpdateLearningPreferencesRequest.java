package com.aimentor.domain.learning.dto.request;

public record UpdateLearningPreferencesRequest(
        String placementDifficulty,
        Boolean placementDone,
        Integer dailyUsed
) {
}
