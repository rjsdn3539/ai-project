package com.aimentor.domain.interview.entity;

import com.aimentor.common.entity.BaseTimeEntity;
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
@Table(name = "interview_feedback")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class InterviewFeedback extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "interview_session_id", unique = true)
    private InterviewSession interviewSession;

    @Column(nullable = false)
    private Integer relevanceScore;

    @Column(nullable = false)
    private Integer logicScore;

    @Column(nullable = false)
    private Integer specificityScore;

    @Column(nullable = false)
    private Integer overallScore;

    @Column(nullable = false, length = 2000)
    private String summary;

    @Column(length = 1000)
    private String weakPoints;

    @Column(length = 1000)
    private String improvements;

    @Column(length = 2000)
    private String recommendedAnswer;

    @Builder
    public InterviewFeedback(
            InterviewSession interviewSession,
            Integer relevanceScore,
            Integer logicScore,
            Integer specificityScore,
            Integer overallScore,
            String summary,
            String weakPoints,
            String improvements,
            String recommendedAnswer
    ) {
        this.interviewSession = interviewSession;
        this.relevanceScore = relevanceScore;
        this.logicScore = logicScore;
        this.specificityScore = specificityScore;
        this.overallScore = overallScore;
        this.summary = summary;
        this.weakPoints = weakPoints;
        this.improvements = improvements;
        this.recommendedAnswer = recommendedAnswer;
    }

    public void update(
            Integer relevanceScore,
            Integer logicScore,
            Integer specificityScore,
            Integer overallScore,
            String summary,
            String weakPoints,
            String improvements,
            String recommendedAnswer
    ) {
        this.relevanceScore = relevanceScore;
        this.logicScore = logicScore;
        this.specificityScore = specificityScore;
        this.overallScore = overallScore;
        this.summary = summary;
        this.weakPoints = weakPoints;
        this.improvements = improvements;
        this.recommendedAnswer = recommendedAnswer;
    }
}
