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
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "learning_profiles")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LearningProfile extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    @Column(nullable = false, length = 20)
    private String placementDifficulty;

    @Column(nullable = false)
    private boolean placementCompleted;

    @Column(nullable = false)
    private int totalAttempts;

    @Column(nullable = false)
    private int totalCorrectAnswers;

    @Column(columnDefinition = "TEXT")
    private String achievementStatsJson;

    @Builder
    public LearningProfile(
            User user,
            String placementDifficulty,
            boolean placementCompleted,
            int totalAttempts,
            int totalCorrectAnswers,
            String achievementStatsJson
    ) {
        this.user = user;
        this.placementDifficulty = placementDifficulty != null ? placementDifficulty : "MEDIUM";
        this.placementCompleted = placementCompleted;
        this.totalAttempts = totalAttempts;
        this.totalCorrectAnswers = totalCorrectAnswers;
        this.achievementStatsJson = achievementStatsJson;
    }

    public void updatePreferences(String placementDifficulty, Boolean placementCompleted) {
        if (placementDifficulty != null && !placementDifficulty.isBlank()) {
            this.placementDifficulty = placementDifficulty;
        }
        if (placementCompleted != null) {
            this.placementCompleted = placementCompleted;
        }
    }

    public void addStudyStats(int attemptsToAdd, int correctAnswersToAdd) {
        this.totalAttempts += Math.max(0, attemptsToAdd);
        this.totalCorrectAnswers += Math.max(0, correctAnswersToAdd);
    }

    public void updateAchievementStatsJson(String achievementStatsJson) {
        this.achievementStatsJson = achievementStatsJson;
    }
}
