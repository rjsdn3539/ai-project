package com.aimentor.domain.subscription;

import java.time.LocalDateTime;

public record SubscriptionStatusResponse(
        SubscriptionTier tier,
        LocalDateTime expiresAt,
        int usedInterviewsThisMonth,
        int monthlyInterviewLimit,
        int remainingInterviews,
        int dailyLearningLimit,
        int profileDocLimit,
        int maxQuestionCount,
        boolean feedbackScoreVisible,
        int bookDiscountRate,
        SubscriptionTier pendingDowngradeTier
) {
}
