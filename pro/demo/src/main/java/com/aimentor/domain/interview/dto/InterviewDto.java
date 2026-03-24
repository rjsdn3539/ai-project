package com.aimentor.domain.interview.dto;

import com.aimentor.domain.interview.entity.*;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public class InterviewDto {

    // ─── 세션 시작 요청 ─────────────────────────────────────

    @Getter
    public static class TextAnswerRequest {
        private String answerText;
    }

    @Getter
    public static class StartRequest {
        private Long resumeId;
        private Long coverLetterId;
        private Long jobPostingId;
    }

    // ─── 세션 응답 ──────────────────────────────────────────

    @Getter
    public static class SessionResponse {
        private final Long id;
        private final String status;
        private final Long resumeId;
        private final Long coverLetterId;
        private final Long jobPostingId;
        private final LocalDateTime startedAt;
        private final LocalDateTime endedAt;
        private final String currentQuestion; // 다음 질문 (진행 중일 때)

        public SessionResponse(InterviewSession s, String currentQuestion) {
            this.id             = s.getId();
            this.status         = s.getStatus().name();
            this.resumeId       = s.getResumeId();
            this.coverLetterId  = s.getCoverLetterId();
            this.jobPostingId   = s.getJobPostingId();
            this.startedAt      = s.getStartedAt();
            this.endedAt        = s.getEndedAt();
            this.currentQuestion = currentQuestion;
        }
    }

    @Getter
    public static class SessionDetailResponse {
        private final Long id;
        private final String status;
        private final LocalDateTime startedAt;
        private final LocalDateTime endedAt;
        private final List<QAResponse> qaList;

        public SessionDetailResponse(InterviewSession s, List<QAResponse> qaList) {
            this.id        = s.getId();
            this.status    = s.getStatus().name();
            this.startedAt = s.getStartedAt();
            this.endedAt   = s.getEndedAt();
            this.qaList    = qaList;
        }
    }

    // ─── Q&A 응답 ───────────────────────────────────────────

    @Getter
    public static class QAResponse {
        private final Long id;
        private final Integer orderNum;
        private final String question;
        private final String answerText;
        private final String audioUrl;

        public QAResponse(InterviewQA qa) {
            this.id         = qa.getId();
            this.orderNum   = qa.getOrderNum();
            this.question   = qa.getQuestion();
            this.answerText = qa.getAnswerText();
            this.audioUrl   = qa.getAudioUrl();
        }
    }

    // ─── 피드백 응답 ─────────────────────────────────────────

    @Getter
    public static class FeedbackResponse {
        private final Long id;
        private final Integer logicScore;
        private final Integer relevanceScore;
        private final Integer specificityScore;
        private final Integer overallScore;
        private final String weakPoints;
        private final String improvements;
        private final String recommendedAnswer;

        public FeedbackResponse(InterviewFeedback f) {
            this.id                = f.getId();
            this.logicScore        = f.getLogicScore();
            this.relevanceScore    = f.getRelevanceScore();
            this.specificityScore  = f.getSpecificityScore();
            this.overallScore      = f.getOverallScore();
            this.weakPoints        = f.getWeakPoints();
            this.improvements      = f.getImprovements();
            this.recommendedAnswer = f.getRecommendedAnswer();
        }
    }
}
