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
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "learning_progresses",
        uniqueConstraints = @UniqueConstraint(name = "uk_learning_progress_user_subject_difficulty", columnNames = {"user_id", "subject", "difficulty"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LearningProgress extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(nullable = false, length = 20)
    private String difficulty;

    @Column(nullable = false)
    private int totalCount;

    @Column(nullable = false)
    private int currentIndex;

    @Column(columnDefinition = "LONGTEXT")
    private String problemsJson;

    @Column(columnDefinition = "LONGTEXT")
    private String userAnswersJson;

    @Column(columnDefinition = "LONGTEXT")
    private String resultsJson;

    @Builder
    public LearningProgress(
            User user,
            String subject,
            String difficulty,
            int totalCount,
            int currentIndex,
            String problemsJson,
            String userAnswersJson,
            String resultsJson
    ) {
        this.user = user;
        this.subject = subject;
        this.difficulty = difficulty;
        this.totalCount = totalCount;
        this.currentIndex = currentIndex;
        this.problemsJson = problemsJson;
        this.userAnswersJson = userAnswersJson;
        this.resultsJson = resultsJson;
    }

    public void update(
            int totalCount,
            int currentIndex,
            String problemsJson,
            String userAnswersJson,
            String resultsJson
    ) {
        this.totalCount = totalCount;
        this.currentIndex = currentIndex;
        this.problemsJson = problemsJson;
        this.userAnswersJson = userAnswersJson;
        this.resultsJson = resultsJson;
    }
}
