package com.aimentor.domain.learning.dto.response;

public record LearningOverviewResponse(
        String placementDifficulty,
        boolean placementDone,
        int dailyUsed,
        int totalAttempts,
        double correctRate,
        long wrongNotesCount
) {
}
