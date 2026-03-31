package com.aimentor.domain.user.entity;

import com.aimentor.common.entity.BaseTimeEntity;
import com.aimentor.domain.subscription.SubscriptionTier;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "users")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String email;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Role role;

    @Column(length = 1000)
    private String refreshToken;

    private LocalDateTime refreshTokenExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private SubscriptionTier subscriptionTier = SubscriptionTier.FREE;

    private LocalDateTime subscriptionExpiresAt;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private SubscriptionTier pendingDowngradeTier;

    @Column(columnDefinition = "TEXT")
    private String widgetConfig;

    @Builder
    public User(String email, String name, String password, Role role) {
        this.email = email;
        this.name = name;
        this.password = password;
        this.role = role;
        this.subscriptionTier = SubscriptionTier.FREE;
    }

    public void updateRefreshToken(String refreshToken, LocalDateTime refreshTokenExpiresAt) {
        this.refreshToken = refreshToken;
        this.refreshTokenExpiresAt = refreshTokenExpiresAt;
    }

    public void clearRefreshToken() {
        this.refreshToken = null;
        this.refreshTokenExpiresAt = null;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public void updatePassword(String encodedPassword) {
        this.password = encodedPassword;
    }

    public void changeRole(Role role) {
        this.role = role;
    }

    public void updateWidgetConfig(String widgetConfig) {
        this.widgetConfig = widgetConfig;
    }

    public void changeSubscription(SubscriptionTier tier, LocalDateTime expiresAt) {
        this.subscriptionTier = tier;
        this.subscriptionExpiresAt = expiresAt;
        this.pendingDowngradeTier = null; // 업그레이드 시 예약된 다운그레이드 취소
    }

    public void scheduleDowngrade(SubscriptionTier tier) {
        this.pendingDowngradeTier = tier;
    }

    public SubscriptionTier getEffectiveTier() {
        if (subscriptionTier == null || subscriptionTier == SubscriptionTier.FREE) {
            return SubscriptionTier.FREE;
        }
        if (subscriptionExpiresAt != null && subscriptionExpiresAt.isBefore(LocalDateTime.now())) {
            return pendingDowngradeTier != null ? pendingDowngradeTier : SubscriptionTier.FREE;
        }
        return subscriptionTier;
    }
}
