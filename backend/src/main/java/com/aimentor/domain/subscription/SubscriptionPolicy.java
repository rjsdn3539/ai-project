package com.aimentor.domain.subscription;

public class SubscriptionPolicy {

    public static final int UNLIMITED = -1;

    // 월 면접 횟수
    public static int monthlyInterviewLimit(SubscriptionTier tier) {
        return switch (tier) {
            case FREE -> 100;
            case STANDARD -> 10;
            case PRO, PREMIUM -> UNLIMITED;
        };
    }

    // 일 학습 문제 수
    public static int dailyLearningLimit(SubscriptionTier tier) {
        return switch (tier) {
            case FREE -> 20;
            case STANDARD, PRO, PREMIUM -> UNLIMITED;
        };
    }

    // 프로필 문서 저장 개수 (이력서/자기소개서/공고 각각 동일 적용)
    public static int profileDocLimit(SubscriptionTier tier) {
        return switch (tier) {
            case FREE -> 1;
            case STANDARD -> 3;
            case PRO, PREMIUM -> UNLIMITED;
        };
    }

    // 최대 면접 질문 수
    public static int maxQuestionCount(SubscriptionTier tier) {
        return switch (tier) {
            case FREE, STANDARD, PRO, PREMIUM -> 10;
        };
    }

    // 피드백 점수 공개 여부 (FREE는 요약만)
    public static boolean isFeedbackScoreVisible(SubscriptionTier tier) {
        return tier != SubscriptionTier.FREE;
    }

    // 도서 할인율 (%) - PRO: 5%, PREMIUM: 10%
    public static int bookDiscountRate(SubscriptionTier tier) {
        return switch (tier) {
            case PRO -> 5;
            case PREMIUM -> 10;
            default -> 0;
        };
    }

    private SubscriptionPolicy() {}
}
