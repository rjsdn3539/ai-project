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
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(
        name = "interview_bookmarks",
        uniqueConstraints = @UniqueConstraint(name = "uk_interview_bookmark_user_key", columnNames = {"user_id", "bookmark_key"})
)
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InterviewBookmark extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "bookmark_key", nullable = false, length = 100)
    private String bookmarkKey;

    @Column(nullable = false, length = 2000)
    private String questionText;

    @Column(columnDefinition = "TEXT")
    private String answerText;

    @Column(length = 100)
    private String sessionId;

    private LocalDateTime bookmarkedAt;

    @Builder
    public InterviewBookmark(
            User user,
            String bookmarkKey,
            String questionText,
            String answerText,
            String sessionId,
            LocalDateTime bookmarkedAt
    ) {
        this.user = user;
        this.bookmarkKey = bookmarkKey;
        this.questionText = questionText;
        this.answerText = answerText;
        this.sessionId = sessionId;
        this.bookmarkedAt = bookmarkedAt;
    }

    public void update(String questionText, String answerText, String sessionId, LocalDateTime bookmarkedAt) {
        this.questionText = questionText;
        this.answerText = answerText;
        this.sessionId = sessionId;
        this.bookmarkedAt = bookmarkedAt;
    }
}
