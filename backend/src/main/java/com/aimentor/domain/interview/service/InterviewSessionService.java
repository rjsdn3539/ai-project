package com.aimentor.domain.interview.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.interview.dto.request.SaveInterviewAnswerRequest;
import com.aimentor.domain.interview.dto.request.StartInterviewSessionRequest;
import com.aimentor.domain.interview.dto.response.InterviewAnswerResponse;
import com.aimentor.domain.interview.dto.response.InterviewFeedbackResponse;
import com.aimentor.domain.interview.dto.response.InterviewQuestionResponse;
import com.aimentor.domain.interview.dto.response.InterviewResultReportResponse;
import com.aimentor.domain.interview.dto.response.InterviewSessionResponse;
import com.aimentor.domain.interview.entity.InterviewAnswer;
import com.aimentor.domain.interview.entity.InterviewFeedback;
import com.aimentor.domain.interview.entity.InterviewQuestion;
import com.aimentor.domain.interview.entity.InterviewSession;
import com.aimentor.domain.interview.entity.InterviewSessionStatus;
import com.aimentor.domain.interview.repository.InterviewAnswerRepository;
import com.aimentor.domain.interview.repository.InterviewFeedbackRepository;
import com.aimentor.domain.interview.repository.InterviewQuestionRepository;
import com.aimentor.domain.interview.repository.InterviewSessionRepository;
import com.aimentor.domain.learning.service.LearningDataService;
import com.aimentor.domain.profile.entity.CoverLetter;
import com.aimentor.domain.profile.entity.JobPosting;
import com.aimentor.domain.profile.entity.Resume;
import com.aimentor.domain.profile.repository.CoverLetterRepository;
import com.aimentor.domain.profile.repository.JobPostingRepository;
import com.aimentor.domain.profile.repository.ResumeRepository;
import com.aimentor.domain.subscription.SubscriptionPolicy;
import com.aimentor.domain.subscription.SubscriptionService;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import com.aimentor.external.ai.AiIntegrationService;
import com.aimentor.external.ai.dto.AiAnalyzeAnswerFeedbackRequest;
import com.aimentor.external.ai.dto.AiAnalyzeAnswerFeedbackResponse;
import com.aimentor.external.ai.dto.AiGenerateInterviewQuestionsRequest;
import com.aimentor.external.ai.dto.AiGenerateInterviewQuestionsResponse;
import com.aimentor.external.ai.dto.AiGenerateReportSummaryRequest;
import com.aimentor.external.ai.dto.AiGenerateReportSummaryResponse;
import com.aimentor.external.ai.dto.AiQuestionItem;
import com.aimentor.external.ai.dto.AiReportQaItem;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class InterviewSessionService {

    private static final Logger log = LoggerFactory.getLogger(InterviewSessionService.class);
    private static final int DEFAULT_QUESTION_COUNT = 5;

    private final InterviewSessionRepository interviewSessionRepository;
    private final InterviewQuestionRepository interviewQuestionRepository;
    private final InterviewAnswerRepository interviewAnswerRepository;
    private final InterviewFeedbackRepository interviewFeedbackRepository;
    private final UserRepository userRepository;
    private final ResumeRepository resumeRepository;
    private final CoverLetterRepository coverLetterRepository;
    private final JobPostingRepository jobPostingRepository;
    private final AiIntegrationService aiIntegrationService;
    private final SubscriptionService subscriptionService;
    private final LearningDataService learningDataService;

    public InterviewSessionService(
            InterviewSessionRepository interviewSessionRepository,
            InterviewQuestionRepository interviewQuestionRepository,
            InterviewAnswerRepository interviewAnswerRepository,
            InterviewFeedbackRepository interviewFeedbackRepository,
            UserRepository userRepository,
            ResumeRepository resumeRepository,
            CoverLetterRepository coverLetterRepository,
            JobPostingRepository jobPostingRepository,
            AiIntegrationService aiIntegrationService,
            SubscriptionService subscriptionService,
            LearningDataService learningDataService
    ) {
        this.interviewSessionRepository = interviewSessionRepository;
        this.interviewQuestionRepository = interviewQuestionRepository;
        this.interviewAnswerRepository = interviewAnswerRepository;
        this.interviewFeedbackRepository = interviewFeedbackRepository;
        this.userRepository = userRepository;
        this.resumeRepository = resumeRepository;
        this.coverLetterRepository = coverLetterRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.aiIntegrationService = aiIntegrationService;
        this.subscriptionService = subscriptionService;
        this.learningDataService = learningDataService;
    }

    @Transactional
    public InterviewSessionResponse startSession(Long userId, StartInterviewSessionRequest request) {
        subscriptionService.checkInterviewLimit(userId);

        User user = getUser(userId);
        Resume resume = getOwnedResume(userId, request.resumeId());
        CoverLetter coverLetter = getOwnedCoverLetter(userId, request.coverLetterId());
        JobPosting jobPosting = getOwnedJobPosting(userId, request.jobPostingId());
        log.info(
                "Starting interview session - userId={}, title={}, positionTitle={}, resume={}, coverLetter={}, jobPosting={}",
                userId,
                request.title(),
                request.positionTitle(),
                describeResume(resume),
                describeCoverLetter(coverLetter),
                describeJobPosting(jobPosting)
        );
        String resumeSnapshot = buildResumeSnapshot(resume);
        String coverLetterSnapshot = buildCoverLetterSnapshot(coverLetter);
        String jobPostingSnapshot = buildJobPostingSnapshot(jobPosting);
        log.info(
                "Interview prompt sources (text snapshots) - resumeChars={}, coverLetterChars={}, jobPostingChars={}, resumePreview={}, coverLetterPreview={}, jobPostingPreview={}",
                textLength(resumeSnapshot),
                textLength(coverLetterSnapshot),
                textLength(jobPostingSnapshot),
                previewText(resumeSnapshot),
                previewText(coverLetterSnapshot),
                previewText(jobPostingSnapshot)
        );

        InterviewSession interviewSession = InterviewSession.builder()
                .user(user)
                .title(request.title())
                .positionTitle(request.positionTitle())
                .resumeId(request.resumeId())
                .coverLetterId(request.coverLetterId())
                .jobPostingId(request.jobPostingId())
                .resumeSnapshot(resumeSnapshot)
                .coverLetterSnapshot(coverLetterSnapshot)
                .jobPostingSnapshot(jobPostingSnapshot)
                .status(InterviewSessionStatus.IN_PROGRESS)
                .startedAt(LocalDateTime.now())
                .build();

        InterviewSession savedSession = interviewSessionRepository.save(interviewSession);

        int resolvedQuestionCount = subscriptionService.resolveQuestionCount(userId, request.questionCount());
        List<AiQuestionItem> generatedQuestions = safelyGenerateInterviewQuestions(savedSession, resolvedQuestionCount);
        List<InterviewQuestion> questions = new ArrayList<>();
        for (AiQuestionItem generatedQuestion : generatedQuestions) {
            InterviewQuestion question = InterviewQuestion.builder()
                    .interviewSession(savedSession)
                    .sequenceNumber(generatedQuestion.sequenceNumber())
                    .questionText(generatedQuestion.questionText())
                    .build();
            questions.add(interviewQuestionRepository.save(question));
            savedSession.addQuestion(question);
        }

        return toSessionResponse(savedSession);
    }

    public List<InterviewSessionResponse> getSessions(Long userId) {
        return interviewSessionRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .map(this::toSessionResponse)
                .toList();
    }

    public InterviewSessionResponse getSessionDetail(Long userId, Long sessionId) {
        return toSessionResponse(getOwnedSession(userId, sessionId));
    }

    @Transactional
    public InterviewAnswerResponse saveAnswer(Long userId, Long sessionId, SaveInterviewAnswerRequest request) {
        InterviewSession interviewSession = getOwnedSession(userId, sessionId);

        if (interviewSession.getStatus() == InterviewSessionStatus.COMPLETED) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SESSION_ALREADY_COMPLETED", "이미 종료된 면접 세션입니다.");
        }

        InterviewQuestion interviewQuestion = interviewQuestionRepository
                .findByIdAndInterviewSessionIdAndInterviewSessionUserId(request.questionId(), sessionId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "QUESTION_NOT_FOUND", "면접 질문을 찾을 수 없습니다."));

        InterviewAnswer answer = interviewQuestion.getAnswer();
        if (answer == null) {
            InterviewAnswer newAnswer = InterviewAnswer.builder()
                    .interviewQuestion(interviewQuestion)
                    .answerText(request.answerText())
                    .audioUrl(request.audioUrl())
                    .build();
            InterviewAnswer savedAnswer = interviewAnswerRepository.save(newAnswer);
            interviewQuestion.assignAnswer(savedAnswer);
            refreshSessionFeedback(interviewSession);
            return toAnswerResponse(savedAnswer);
        }

        answer.update(request.answerText(), request.audioUrl());
        refreshSessionFeedback(interviewSession);
        return toAnswerResponse(answer);
    }

    @Transactional
    public InterviewSessionResponse endSession(Long userId, Long sessionId) {
        InterviewSession interviewSession = getOwnedSession(userId, sessionId);

        if (interviewSession.getStatus() == InterviewSessionStatus.COMPLETED) {
            return toSessionResponse(interviewSession);
        }

        refreshSessionFeedback(interviewSession);
        interviewSession.end();
        learningDataService.recordInterviewCompletion(userId, interviewSession.getEndedAt());
        return toSessionResponse(interviewSession);
    }

    public InterviewResultReportResponse getResultReport(Long userId, Long sessionId) {
        InterviewSession interviewSession = getOwnedSession(userId, sessionId);
        User user = getUser(userId);
        boolean scoreVisible = SubscriptionPolicy.isFeedbackScoreVisible(user.getEffectiveTier());
        return new InterviewResultReportResponse(
                interviewSession.getId(),
                interviewSession.getTitle(),
                interviewSession.getPositionTitle(),
                interviewSession.getStatus(),
                interviewSession.getStartedAt(),
                interviewSession.getEndedAt(),
                interviewSession.getQuestions().stream()
                        .sorted(Comparator.comparing(InterviewQuestion::getSequenceNumber))
                        .map(this::toQuestionResponse)
                        .toList(),
                toFeedbackResponse(interviewSession.getFeedback(), scoreVisible)
        );
    }

    private void refreshSessionFeedback(InterviewSession interviewSession) {
        List<InterviewQuestion> answeredQuestions = interviewSession.getQuestions().stream()
                .filter(question -> question.getAnswer() != null && question.getAnswer().getAnswerText() != null)
                .sorted(Comparator.comparing(InterviewQuestion::getSequenceNumber))
                .toList();

        if (answeredQuestions.isEmpty()) {
            replaceSessionFeedback(interviewSession, 0, 0, 0, 0, "아직 제출된 답변이 없습니다.", null, null);
            return;
        }

        List<AiAnalyzeAnswerFeedbackResponse> feedbackItems = answeredQuestions.stream()
                .map(question -> safelyAnalyzeAnswer(interviewSession, question))
                .toList();

        int relevanceScore = average(feedbackItems.stream().mapToInt(AiAnalyzeAnswerFeedbackResponse::relevanceScore).toArray());
        int logicScore = average(feedbackItems.stream().mapToInt(AiAnalyzeAnswerFeedbackResponse::logicScore).toArray());
        int specificityScore = average(feedbackItems.stream().mapToInt(AiAnalyzeAnswerFeedbackResponse::specificityScore).toArray());
        int overallScore = average(feedbackItems.stream().mapToInt(AiAnalyzeAnswerFeedbackResponse::overallScore).toArray());

        List<AiReportQaItem> qaItems = new ArrayList<>();
        for (int i = 0; i < answeredQuestions.size(); i++) {
            InterviewQuestion q = answeredQuestions.get(i);
            AiAnalyzeAnswerFeedbackResponse f = feedbackItems.get(i);
            qaItems.add(new AiReportQaItem(
                    q.getQuestionText(),
                    q.getAnswer().getAnswerText(),
                    f.relevanceScore(), f.logicScore(), f.specificityScore(), f.overallScore(),
                    f.feedbackSummary()
            ));
        }

        AiGenerateReportSummaryResponse reportSummary = safelyGenerateReportSummary(interviewSession, qaItems);
        replaceSessionFeedback(interviewSession, relevanceScore, logicScore, specificityScore, overallScore,
                reportSummary.weakPoints(), reportSummary.improvements(), reportSummary.recommendedAnswer());
    }

    private void replaceSessionFeedback(
            InterviewSession interviewSession,
            int relevanceScore,
            int logicScore,
            int specificityScore,
            int overallScore,
            String weakPoints,
            String improvements,
            String recommendedAnswer
    ) {
        String summary = weakPoints != null ? weakPoints : "피드백을 생성할 수 없습니다.";
        InterviewFeedback currentFeedback = interviewSession.getFeedback();
        if (currentFeedback != null) {
            currentFeedback.update(relevanceScore, logicScore, specificityScore, overallScore, summary, weakPoints, improvements, recommendedAnswer);
            return;
        }

        InterviewFeedback feedback = InterviewFeedback.builder()
                .interviewSession(interviewSession)
                .relevanceScore(relevanceScore)
                .logicScore(logicScore)
                .specificityScore(specificityScore)
                .overallScore(overallScore)
                .summary(summary)
                .weakPoints(weakPoints)
                .improvements(improvements)
                .recommendedAnswer(recommendedAnswer)
                .build();
        interviewSession.assignFeedback(interviewFeedbackRepository.save(feedback));
    }

    private String resolveDifficulty(Long userId) {
        Double avg = interviewSessionRepository.findAverageOverallScoreByUserId(userId);
        if (avg == null) return "MEDIUM";
        if (avg < 50) return "EASY";
        if (avg < 70) return "MEDIUM";
        return "HARD";
    }

    private List<AiQuestionItem> safelyGenerateInterviewQuestions(InterviewSession session, Integer requestedQuestionCount) {
        int questionCount = requestedQuestionCount == null ? DEFAULT_QUESTION_COUNT : requestedQuestionCount;
        String difficulty = resolveDifficulty(session.getUser().getId());
        log.info("면접 난이도 결정 - userId={}, difficulty={}", session.getUser().getId(), difficulty);

        try {
            AiGenerateInterviewQuestionsResponse response = aiIntegrationService.generateInterviewQuestions(
                    new AiGenerateInterviewQuestionsRequest(
                            session.getPositionTitle(),
                            mergeContext(session.getResumeSnapshot(), session.getCoverLetterSnapshot()),
                            session.getJobPostingSnapshot(),
                            questionCount,
                            difficulty
                    )
            );

            if (response != null && response.questions() != null && !response.questions().isEmpty()) {
                return response.questions();
            }
        } catch (Exception e) {
            log.error("AI 질문 생성 실패 - positionTitle={}, questionCount={}: {}", session.getPositionTitle(), questionCount, e.getMessage(), e);
        }

        return buildFallbackQuestions(session.getPositionTitle(), questionCount);
    }

    private List<AiQuestionItem> buildFallbackQuestions(String positionTitle, int questionCount) {
        List<AiQuestionItem> fallbackQuestions = new ArrayList<>();
        for (int index = 1; index <= questionCount; index++) {
            fallbackQuestions.add(new AiQuestionItem(index, positionTitle + " 지원자를 위한 기본 질문 " + index + "입니다."));
        }
        return fallbackQuestions;
    }

    private AiAnalyzeAnswerFeedbackResponse safelyAnalyzeAnswer(InterviewSession interviewSession, InterviewQuestion interviewQuestion) {
        try {
            AiAnalyzeAnswerFeedbackResponse response = aiIntegrationService.analyzeAnswerFeedback(
                    new AiAnalyzeAnswerFeedbackRequest(
                            interviewQuestion.getQuestionText(),
                            interviewQuestion.getAnswer().getAnswerText(),
                            interviewSession.getJobPostingSnapshot()
                    )
            );

            if (response != null) {
                return response;
            }
        } catch (Exception e) {
            log.error("AI 답변 분석 실패 - questionId={}: {}", interviewQuestion.getId(), e.getMessage(), e);
        }

        return new AiAnalyzeAnswerFeedbackResponse(
                0,
                0,
                0,
                0,
                "AI 분석을 사용할 수 없어 기본 피드백으로 대체되었습니다.",
                "fallback-ai",
                true
        );
    }

    private AiGenerateReportSummaryResponse safelyGenerateReportSummary(
            InterviewSession interviewSession,
            List<AiReportQaItem> feedbackItems
    ) {
        try {
            AiGenerateReportSummaryResponse response = aiIntegrationService.generateReportSummary(
                    new AiGenerateReportSummaryRequest(
                            interviewSession.getTitle(),
                            interviewSession.getPositionTitle(),
                            feedbackItems
                    )
            );

            if (response != null && response.weakPoints() != null) {
                return response;
            }
        } catch (Exception e) {
            log.error("AI 리포트 요약 생성 실패: {}", e.getMessage(), e);
        }

        return new AiGenerateReportSummaryResponse(
                "AI 피드백 생성에 실패했습니다. 답변을 다시 검토해보세요.",
                "더 구체적인 경험과 수치를 포함하여 답변해보세요.",
                "저는 [프로젝트]에서 [문제]를 [방법]으로 해결했고, 결과적으로 [성과]를 달성했습니다.",
                "fallback-ai",
                true
        );
    }

    private String mergeContext(String firstContext, String secondContext) {
        if (firstContext == null && secondContext == null) {
            return null;
        }
        if (firstContext == null) {
            return secondContext;
        }
        if (secondContext == null) {
            return firstContext;
        }
        return firstContext + "\n\n" + secondContext;
    }

    private int average(int[] scores) {
        if (scores.length == 0) {
            return 0;
        }

        int sum = 0;
        for (int score : scores) {
            sum += score;
        }
        return Math.round((float) sum / scores.length);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
    }

    private Resume getOwnedResume(Long userId, Long resumeId) {
        if (resumeId == null) {
            return null;
        }

        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESUME_NOT_FOUND", "이력서를 찾을 수 없습니다."));
    }

    private CoverLetter getOwnedCoverLetter(Long userId, Long coverLetterId) {
        if (coverLetterId == null) {
            return null;
        }

        return coverLetterRepository.findByIdAndUserId(coverLetterId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "COVER_LETTER_NOT_FOUND", "자기소개서를 찾을 수 없습니다."));
    }

    private JobPosting getOwnedJobPosting(Long userId, Long jobPostingId) {
        if (jobPostingId == null) {
            return null;
        }

        return jobPostingRepository.findByIdAndUserId(jobPostingId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "JOB_POSTING_NOT_FOUND", "채용공고를 찾을 수 없습니다."));
    }

    private InterviewSession getOwnedSession(Long userId, Long sessionId) {
        return interviewSessionRepository.findByIdAndUserId(sessionId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INTERVIEW_SESSION_NOT_FOUND", "면접 세션을 찾을 수 없습니다."));
    }

    private String buildResumeSnapshot(Resume resume) {
        if (resume == null) {
            return null;
        }
        return "이력서 제목: " + resume.getTitle() + "\n이력서 내용: " + resume.getContent();
    }

    private String buildCoverLetterSnapshot(CoverLetter coverLetter) {
        if (coverLetter == null) {
            return null;
        }
        return "자기소개서 제목: " + coverLetter.getTitle()
                + "\n회사명: " + coverLetter.getCompanyName()
                + "\n내용: " + coverLetter.getContent();
    }

    private String buildJobPostingSnapshot(JobPosting jobPosting) {
        if (jobPosting == null) {
            return null;
        }
        return "회사명: " + jobPosting.getCompanyName()
                + "\n직무명: " + jobPosting.getPositionTitle()
                + "\n상세 내용: " + jobPosting.getDescription();
    }

    private String describeResume(Resume resume) {
        if (resume == null) {
            return "none";
        }
        return "id=" + resume.getId() + ", title=" + resume.getTitle();
    }

    private String describeCoverLetter(CoverLetter coverLetter) {
        if (coverLetter == null) {
            return "none";
        }
        return "id=" + coverLetter.getId()
                + ", title=" + coverLetter.getTitle()
                + ", company=" + coverLetter.getCompanyName();
    }

    private String describeJobPosting(JobPosting jobPosting) {
        if (jobPosting == null) {
            return "none";
        }
        return "id=" + jobPosting.getId()
                + ", company=" + jobPosting.getCompanyName()
                + ", position=" + jobPosting.getPositionTitle();
    }

    private int textLength(String value) {
        return value == null ? 0 : value.length();
    }

    private String previewText(String value) {
        if (value == null || value.isBlank()) {
            return "none";
        }
        String normalized = value.replace("\n", "\\n").replace("\r", "");
        int maxLength = 120;
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength) + "...";
    }

    private InterviewSessionResponse toSessionResponse(InterviewSession interviewSession) {
        return new InterviewSessionResponse(
                interviewSession.getId(),
                interviewSession.getTitle(),
                interviewSession.getPositionTitle(),
                interviewSession.getStatus(),
                interviewSession.getStartedAt(),
                interviewSession.getEndedAt(),
                interviewSession.getQuestions().stream()
                        .sorted(Comparator.comparing(InterviewQuestion::getSequenceNumber))
                        .map(this::toQuestionResponse)
                        .toList(),
                toFeedbackResponse(interviewSession.getFeedback())
        );
    }

    private InterviewQuestionResponse toQuestionResponse(InterviewQuestion question) {
        return new InterviewQuestionResponse(
                question.getId(),
                question.getSequenceNumber(),
                question.getQuestionText(),
                toAnswerResponse(question.getAnswer())
        );
    }

    private InterviewAnswerResponse toAnswerResponse(InterviewAnswer answer) {
        if (answer == null) {
            return null;
        }

        return new InterviewAnswerResponse(
                answer.getId(),
                answer.getAnswerText(),
                answer.getAudioUrl(),
                answer.getCreatedAt(),
                answer.getUpdatedAt()
        );
    }

    private InterviewFeedbackResponse toFeedbackResponse(InterviewFeedback feedback) {
        return toFeedbackResponse(feedback, true);
    }

    private InterviewFeedbackResponse toFeedbackResponse(InterviewFeedback feedback, boolean scoreVisible) {
        if (feedback == null) {
            return null;
        }

        return new InterviewFeedbackResponse(
                scoreVisible ? feedback.getRelevanceScore() : null,
                scoreVisible ? feedback.getLogicScore() : null,
                scoreVisible ? feedback.getSpecificityScore() : null,
                scoreVisible ? feedback.getOverallScore() : null,
                feedback.getSummary(),
                feedback.getWeakPoints(),
                feedback.getImprovements(),
                feedback.getRecommendedAnswer()
        );
    }
}
