package com.aimentor.domain.subscription;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.interview.repository.InterviewSessionRepository;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class SubscriptionService {

    private final UserRepository userRepository;
    private final InterviewSessionRepository interviewSessionRepository;

    public SubscriptionService(UserRepository userRepository,
                               InterviewSessionRepository interviewSessionRepository) {
        this.userRepository = userRepository;
        this.interviewSessionRepository = interviewSessionRepository;
    }

    public SubscriptionStatusResponse getMyStatus(Long userId) {
        User user = getUser(userId);
        SubscriptionTier tier = user.getEffectiveTier();

        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long usedInterviews = interviewSessionRepository.countByUserIdAndStartedAtAfter(userId, monthStart);

        int interviewLimit = SubscriptionPolicy.monthlyInterviewLimit(tier);
        int remaining = interviewLimit == SubscriptionPolicy.UNLIMITED ? SubscriptionPolicy.UNLIMITED
                : (int) Math.max(0, interviewLimit - usedInterviews);

        return new SubscriptionStatusResponse(
                tier,
                user.getSubscriptionExpiresAt(),
                (int) usedInterviews,
                interviewLimit,
                remaining,
                SubscriptionPolicy.dailyLearningLimit(tier),
                SubscriptionPolicy.profileDocLimit(tier),
                SubscriptionPolicy.maxQuestionCount(tier),
                SubscriptionPolicy.isFeedbackScoreVisible(tier),
                SubscriptionPolicy.bookDiscountRate(tier),
                user.getPendingDowngradeTier()
        );
    }

    @Transactional
    public void changeSubscription(Long userId, SubscriptionTier tier, int durationMonths) {
        User user = getUser(userId);
        LocalDateTime expiresAt = tier == SubscriptionTier.FREE ? null
                : LocalDateTime.now().plusMonths(durationMonths);
        user.changeSubscription(tier, expiresAt);
    }

    @Transactional
    public void scheduleDowngrade(Long userId, SubscriptionTier targetTier) {
        User user = getUser(userId);
        SubscriptionTier currentTier = user.getEffectiveTier();

        if (targetTier.ordinal() >= currentTier.ordinal()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_DOWNGRADE",
                    "현재 플랜보다 낮은 플랜으로만 다운그레이드할 수 있습니다.");
        }

        if (user.getSubscriptionExpiresAt() == null) {
            // 만료일이 없는 구독(무기한)은 즉시 다운그레이드 적용
            LocalDateTime expiresAt = targetTier == SubscriptionTier.FREE ? null
                    : LocalDateTime.now().plusMonths(1);
            user.changeSubscription(targetTier, expiresAt);
        } else {
            // 만료일이 있는 경우 결제 기간 종료 시 적용
            user.scheduleDowngrade(targetTier);
        }
    }

    public void checkInterviewLimit(Long userId) {
        User user = getUser(userId);
        SubscriptionTier tier = user.getEffectiveTier();

        int limit = SubscriptionPolicy.monthlyInterviewLimit(tier);
        if (limit == SubscriptionPolicy.UNLIMITED) {
            return;
        }

        LocalDateTime monthStart = LocalDateTime.now().withDayOfMonth(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
        long used = interviewSessionRepository.countByUserIdAndStartedAtAfter(userId, monthStart);

        if (used >= limit) {
            if (tier == SubscriptionTier.FREE) {
                throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "SUBSCRIPTION_REQUIRED",
                        "무료 플랜은 월 1회 면접이 제공됩니다. 더 많은 면접을 원하시면 구독해주세요.");
            }
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "MONTHLY_INTERVIEW_LIMIT_EXCEEDED",
                    "이번 달 면접 횟수(" + limit + "회)를 모두 사용하셨습니다. 플랜을 업그레이드해주세요.");
        }
    }

    public int resolveQuestionCount(Long userId, Integer requested) {
        User user = getUser(userId);
        SubscriptionTier tier = user.getEffectiveTier();
        int maxAllowed = SubscriptionPolicy.maxQuestionCount(tier);

        if (requested == null || requested <= 0) {
            return 5;
        }
        return Math.min(requested, maxAllowed);
    }

    @Transactional
    public void cancelDowngrade(Long userId) {
        User user = getUser(userId);
        if (user.getPendingDowngradeTier() == null) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "NO_PENDING_DOWNGRADE",
                    "예약된 다운그레이드가 없습니다.");
        }
        user.scheduleDowngrade(null);
    }

    public void checkProfileDocLimit(Long userId, long currentCount) {
        User user = getUser(userId);
        SubscriptionTier tier = user.getEffectiveTier();
        int limit = SubscriptionPolicy.profileDocLimit(tier);

        if (limit == SubscriptionPolicy.UNLIMITED) {
            return;
        }
        if (currentCount >= limit) {
            throw new ApiException(HttpStatus.PAYMENT_REQUIRED, "PROFILE_DOC_LIMIT_EXCEEDED",
                    "현재 플랜에서는 최대 " + limit + "개까지 저장할 수 있습니다. 플랜을 업그레이드해주세요.");
        }
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
    }
}
