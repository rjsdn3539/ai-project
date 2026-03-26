package com.aimentor.domain.learning.entity;

import com.aimentor.common.entity.BaseTimeEntity;
import com.aimentor.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "learning_daily_usages",
        uniqueConstraints = @UniqueConstraint(name = "uk_learning_daily_usage_user_date", columnNames = {"user_id", "usage_date"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LearningDailyUsage extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "usage_date", nullable = false)
    private LocalDate usageDate;

    @Column(nullable = false)
    private int usedCount;

    @Builder
    public LearningDailyUsage(User user, LocalDate usageDate, int usedCount) {
        this.user = user;
        this.usageDate = usageDate;
        this.usedCount = usedCount;
    }

    public void increment(int count) {
        this.usedCount += Math.max(0, count);
    }
}
