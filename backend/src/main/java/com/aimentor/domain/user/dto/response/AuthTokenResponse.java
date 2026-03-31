package com.aimentor.domain.user.dto.response;

import com.aimentor.domain.subscription.SubscriptionTier;
import com.aimentor.domain.user.entity.Role;
import java.time.LocalDateTime;

public record AuthTokenResponse(
        Long userId,
        String name,
        String email,
        Role role,
        SubscriptionTier subscriptionTier,
        String accessToken,
        LocalDateTime accessTokenExpiresAt,
        String refreshToken,
        LocalDateTime refreshTokenExpiresAt
) {
}
