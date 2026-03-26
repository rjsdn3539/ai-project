package com.aimentor.domain.learning.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.interview.entity.InterviewSession;
import com.aimentor.domain.interview.entity.InterviewSessionStatus;
import com.aimentor.domain.interview.repository.InterviewSessionRepository;
import com.aimentor.domain.learning.dto.request.CreateInterviewBookmarkRequest;
import com.aimentor.domain.learning.dto.request.CreateWrongNoteRequest;
import com.aimentor.domain.learning.dto.request.SubmitLearningSessionResultRequest;
import com.aimentor.domain.learning.dto.request.UpdateLearningPreferencesRequest;
import com.aimentor.domain.learning.dto.request.UpsertAchievementStateRequest;
import com.aimentor.domain.learning.dto.request.UpsertLearningProgressRequest;
import com.aimentor.domain.learning.dto.response.AchievementStateResponse;
import com.aimentor.domain.learning.dto.response.InterviewBookmarkResponse;
import com.aimentor.domain.learning.dto.response.LearningOverviewResponse;
import com.aimentor.domain.learning.dto.response.LearningProgressResponse;
import com.aimentor.domain.learning.dto.response.WrongNoteResponse;
import com.aimentor.domain.learning.entity.InterviewBookmark;
import com.aimentor.domain.learning.entity.LearningDailyUsage;
import com.aimentor.domain.learning.entity.LearningProfile;
import com.aimentor.domain.learning.entity.LearningProgress;
import com.aimentor.domain.learning.entity.WrongNote;
import com.aimentor.domain.learning.repository.InterviewBookmarkRepository;
import com.aimentor.domain.learning.repository.LearningDailyUsageRepository;
import com.aimentor.domain.learning.repository.LearningProfileRepository;
import com.aimentor.domain.learning.repository.LearningProgressRepository;
import com.aimentor.domain.learning.repository.WrongNoteRepository;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.JsonNodeFactory;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Predicate;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class LearningDataService {

    private static final List<AchievementRule> ACHIEVEMENT_RULES = List.of(
            new AchievementRule("first_interview", stats -> intStat(stats, "totalInterviews") >= 1),
            new AchievementRule("interview_3", stats -> intStat(stats, "totalInterviews") >= 3),
            new AchievementRule("interview_5", stats -> intStat(stats, "totalInterviews") >= 5),
            new AchievementRule("interview_10", stats -> intStat(stats, "totalInterviews") >= 10),
            new AchievementRule("interview_20", stats -> intStat(stats, "totalInterviews") >= 20),
            new AchievementRule("interview_30", stats -> intStat(stats, "totalInterviews") >= 30),
            new AchievementRule("score_70", stats -> intStat(stats, "bestScore") >= 70),
            new AchievementRule("score_80", stats -> intStat(stats, "bestScore") >= 80),
            new AchievementRule("score_90", stats -> intStat(stats, "bestScore") >= 90),
            new AchievementRule("score_100", stats -> intStat(stats, "bestScore") >= 100),
            new AchievementRule("first_study", stats -> intStat(stats, "totalStudyProblems") >= 1),
            new AchievementRule("study_10", stats -> intStat(stats, "totalStudyProblems") >= 10),
            new AchievementRule("study_30", stats -> intStat(stats, "totalStudyProblems") >= 30),
            new AchievementRule("study_50", stats -> intStat(stats, "totalStudyProblems") >= 50),
            new AchievementRule("study_100", stats -> intStat(stats, "totalStudyProblems") >= 100),
            new AchievementRule("study_200", stats -> intStat(stats, "totalStudyProblems") >= 200),
            new AchievementRule("study_300", stats -> intStat(stats, "totalStudyProblems") >= 300),
            new AchievementRule("perfect_study", stats -> booleanStat(stats, "hadPerfectStudy")),
            new AchievementRule("multi_subject_3", stats -> arraySize(stats, "subjectsStudied") >= 3),
            new AchievementRule("multi_subject", stats -> arraySize(stats, "subjectsStudied") >= 5),
            new AchievementRule("multi_subject_7", stats -> arraySize(stats, "subjectsStudied") >= 7),
            new AchievementRule("streak_3", stats -> intStat(stats, "longestStreak") >= 3),
            new AchievementRule("streak_7", stats -> intStat(stats, "longestStreak") >= 7),
            new AchievementRule("streak_14", stats -> intStat(stats, "longestStreak") >= 14),
            new AchievementRule("streak_30", stats -> intStat(stats, "longestStreak") >= 30),
            new AchievementRule("streak_60", stats -> intStat(stats, "longestStreak") >= 60),
            new AchievementRule("streak_100", stats -> intStat(stats, "longestStreak") >= 100),
            new AchievementRule("first_bookmark", stats -> intStat(stats, "totalBookmarks") >= 1),
            new AchievementRule("bookmark_5", stats -> intStat(stats, "totalBookmarks") >= 5),
            new AchievementRule("bookmark_10", stats -> intStat(stats, "totalBookmarks") >= 10),
            new AchievementRule("bookmark_20", stats -> intStat(stats, "totalBookmarks") >= 20),
            new AchievementRule("early_bird", stats -> booleanStat(stats, "studiedEarlyMorning")),
            new AchievementRule("morning_routine", stats -> booleanStat(stats, "morningStudy")),
            new AchievementRule("night_owl", stats -> booleanStat(stats, "studiedLateNight")),
            new AchievementRule("all_rounder", stats -> booleanStat(stats, "didBothSameDay")),
            new AchievementRule("weekend_warrior", stats -> booleanStat(stats, "weekendActivity")),
            new AchievementRule("comeback", stats -> booleanStat(stats, "cameBack")),
            new AchievementRule("score_improver", stats -> intStat(stats, "scoreImprovement") >= 3)
    );


    private final UserRepository userRepository;
    private final InterviewSessionRepository interviewSessionRepository;
    private final LearningProfileRepository learningProfileRepository;
    private final LearningDailyUsageRepository learningDailyUsageRepository;
    private final LearningProgressRepository learningProgressRepository;
    private final WrongNoteRepository wrongNoteRepository;
    private final InterviewBookmarkRepository interviewBookmarkRepository;
    private final ObjectMapper objectMapper;

    public LearningDataService(
            UserRepository userRepository,
            InterviewSessionRepository interviewSessionRepository,
            LearningProfileRepository learningProfileRepository,
            LearningDailyUsageRepository learningDailyUsageRepository,
            LearningProgressRepository learningProgressRepository,
            WrongNoteRepository wrongNoteRepository,
            InterviewBookmarkRepository interviewBookmarkRepository,
            ObjectMapper objectMapper
    ) {
        this.userRepository = userRepository;
        this.interviewSessionRepository = interviewSessionRepository;
        this.learningProfileRepository = learningProfileRepository;
        this.learningDailyUsageRepository = learningDailyUsageRepository;
        this.learningProgressRepository = learningProgressRepository;
        this.wrongNoteRepository = wrongNoteRepository;
        this.interviewBookmarkRepository = interviewBookmarkRepository;
        this.objectMapper = objectMapper;
    }

    public LearningOverviewResponse getLearningOverview(Long userId) {
        LearningProfile profile = getOrCreateProfile(userId);
        return toLearningOverviewResponse(userId, profile);
    }

    public Map<String, Object> getDashboardSummary(Long userId) {
        LearningProfile profile = getOrCreateProfile(userId);
        List<InterviewSession> sessions = getCompletedSessions(userId);
        List<Integer> scores = sessions.stream()
                .map(InterviewSession::getFeedback)
                .filter(Objects::nonNull)
                .map(feedback -> feedback.getOverallScore())
                .filter(Objects::nonNull)
                .toList();
        ObjectNode mergedStats = buildMergedAchievementStats(userId, profile, listBookmarkResponses(userId));

        Integer averageInterviewScore = scores.isEmpty()
                ? null
                : Math.round((float) scores.stream().mapToInt(Integer::intValue).sum() / scores.size());
        Integer latestInterviewScore = scores.isEmpty() ? null : scores.get(0);
        Integer previousInterviewScore = scores.size() > 1 ? scores.get(1) : null;
        Integer scoreTrend = latestInterviewScore != null && previousInterviewScore != null
                ? latestInterviewScore - previousInterviewScore
                : null;
        Integer bestInterviewScore = scores.isEmpty() ? null : scores.stream().max(Integer::compareTo).orElse(null);

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("totalInterviews", sessions.size());
        summary.put("averageInterviewScore", averageInterviewScore);
        summary.put("latestInterviewScore", latestInterviewScore);
        summary.put("previousInterviewScore", previousInterviewScore);
        summary.put("scoreTrend", scoreTrend);
        summary.put("bestInterviewScore", bestInterviewScore);
        summary.put("totalStudyProblems", profile.getTotalAttempts());
        summary.put("correctRate", calculateCorrectRate(profile));
        summary.put("wrongNotesCount", wrongNoteRepository.countByUserId(userId));
        summary.put("currentStreak", mergedStats.path("currentStreak").asInt(0));
        summary.put("longestStreak", mergedStats.path("longestStreak").asInt(0));
        summary.put("dailyUsed", getDailyUsed(userId));
        return summary;
    }

    public JsonNode getStatsPayload(Long userId) {
        LearningProfile profile = getOrCreateProfile(userId);
        ObjectNode payload = JsonNodeFactory.instance.objectNode();
        payload.put("totalAttempts", profile.getTotalAttempts());
        payload.put("correctRate", calculateCorrectRate(profile));
        return payload;
    }

    public List<LearningProgressResponse> listLearningProgresses(Long userId) {
        return learningProgressRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                .stream()
                .map(this::toLearningProgressResponse)
                .toList();
    }

    public LearningProgressResponse getLearningProgress(Long userId, String subject, String difficulty) {
        return learningProgressRepository.findByUserIdAndSubjectAndDifficulty(userId, subject, difficulty)
                .map(this::toLearningProgressResponse)
                .orElse(null);
    }

    @Transactional
    public LearningProgressResponse upsertLearningProgress(Long userId, UpsertLearningProgressRequest request) {
        User user = getUser(userId);
        LearningProgress progress = learningProgressRepository.findByUserIdAndSubjectAndDifficulty(
                        userId,
                        request.subject(),
                        request.difficulty()
                )
                .orElseGet(() -> LearningProgress.builder()
                        .user(user)
                        .subject(request.subject())
                        .difficulty(request.difficulty())
                        .totalCount(request.count())
                        .currentIndex(request.currentIdx())
                        .problemsJson(writeJson(request.problems()))
                        .userAnswersJson(writeJson(request.userAnswers()))
                        .resultsJson(writeJson(request.results()))
                        .build());

        progress.update(
                request.count(),
                request.currentIdx(),
                writeJson(request.problems()),
                writeJson(request.userAnswers()),
                writeJson(request.results())
        );

        return toLearningProgressResponse(learningProgressRepository.save(progress));
    }

    @Transactional
    public void deleteLearningProgress(Long userId, String subject, String difficulty) {
        learningProgressRepository.deleteByUserIdAndSubjectAndDifficulty(userId, subject, difficulty);
    }

    @Transactional
    public LearningOverviewResponse updateLearningPreferences(Long userId, UpdateLearningPreferencesRequest request) {
        LearningProfile profile = getOrCreateProfile(userId);
        profile.updatePreferences(request.placementDifficulty(), request.placementDone());
        learningProfileRepository.save(profile);

        if (request.dailyUsed() != null && request.dailyUsed() > 0) {
            User user = getUser(userId);
            LocalDate today = LocalDate.now();
            LearningDailyUsage usage = learningDailyUsageRepository.findByUserIdAndUsageDate(userId, today)
                    .orElseGet(() -> LearningDailyUsage.builder()
                            .user(user)
                            .usageDate(today)
                            .usedCount(0)
                            .build());
            if (usage.getUsedCount() < request.dailyUsed()) {
                usage.increment(request.dailyUsed() - usage.getUsedCount());
                learningDailyUsageRepository.save(usage);
            }
        }

        return toLearningOverviewResponse(userId, profile);
    }

    @Transactional
    public LearningOverviewResponse submitSessionResult(Long userId, SubmitLearningSessionResultRequest request) {
        LearningProfile profile = getOrCreateProfile(userId);
        profile.addStudyStats(request.answeredCount(), request.correctCount());
        learningProfileRepository.save(profile);

        if (request.answeredCount() != null && request.answeredCount() > 0) {
            User user = getUser(userId);
            LocalDate today = LocalDate.now();
            LearningDailyUsage usage = learningDailyUsageRepository.findByUserIdAndUsageDate(userId, today)
                    .orElseGet(() -> LearningDailyUsage.builder()
                            .user(user)
                            .usageDate(today)
                            .usedCount(0)
                            .build());
            usage.increment(request.answeredCount());
            learningDailyUsageRepository.save(usage);
        }

        if (request.wrongNotes() != null) {
            for (CreateWrongNoteRequest wrongNoteRequest : request.wrongNotes()) {
                createWrongNoteInternal(userId, wrongNoteRequest);
            }
        }

        recordStudyCompletion(userId, request.subject(), request.answeredCount(), request.correctCount());
        return toLearningOverviewResponse(userId, getOrCreateProfile(userId));
    }

    public List<WrongNoteResponse> listWrongNotes(Long userId) {
        return wrongNoteRepository.findByUserIdOrderBySolvedDateDescCreatedAtDesc(userId)
                .stream()
                .map(this::toWrongNoteResponse)
                .toList();
    }

    @Transactional
    public WrongNoteResponse createWrongNote(Long userId, CreateWrongNoteRequest request) {
        return toWrongNoteResponse(createWrongNoteInternal(userId, request));
    }

    @Transactional
    public void deleteWrongNote(Long userId, Long noteId) {
        WrongNote wrongNote = wrongNoteRepository.findByIdAndUserId(noteId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "WRONG_NOTE_NOT_FOUND", "Wrong note not found"));
        wrongNoteRepository.delete(wrongNote);
    }

    @Transactional
    public void clearWrongNotes(Long userId) {
        wrongNoteRepository.deleteByUserId(userId);
    }

    @Transactional
    public AchievementStateResponse getAchievementState(Long userId) {
        LearningProfile profile = getOrCreateProfile(userId);
        List<InterviewBookmarkResponse> bookmarks = listBookmarkResponses(userId);
        return buildAchievementState(userId, profile, bookmarks, true);
    }

    @Transactional
    public AchievementStateResponse updateAchievementState(Long userId, UpsertAchievementStateRequest request) {
        LearningProfile profile = getOrCreateProfile(userId);
        ObjectNode requestStats = toObjectNode(request.stats());
        profile.updateAchievementStatsJson(writeJson(request.stats()));

        int migratedStudyProblems = requestStats.path("totalStudyProblems").asInt(0);
        if (migratedStudyProblems > profile.getTotalAttempts()) {
            profile.addStudyStats(migratedStudyProblems - profile.getTotalAttempts(), 0);
        }

        learningProfileRepository.save(profile);
        return buildAchievementState(userId, profile, listBookmarkResponses(userId), true);
    }

    @Transactional
    public InterviewBookmarkResponse createInterviewBookmark(Long userId, CreateInterviewBookmarkRequest request) {
        User user = getUser(userId);
        LocalDateTime bookmarkedAt = parseDateTime(request.date());
        InterviewBookmark bookmark = interviewBookmarkRepository.findByUserIdAndBookmarkKey(userId, request.id())
                .orElseGet(() -> InterviewBookmark.builder()
                        .user(user)
                        .bookmarkKey(request.id())
                        .questionText(request.questionText())
                        .answerText(request.answerText())
                        .sessionId(request.sessionId())
                        .bookmarkedAt(bookmarkedAt)
                        .build());

        bookmark.update(request.questionText(), request.answerText(), request.sessionId(), bookmarkedAt);
        return toInterviewBookmarkResponse(interviewBookmarkRepository.save(bookmark));
    }

    @Transactional
    public void deleteInterviewBookmark(Long userId, String bookmarkKey) {
        interviewBookmarkRepository.deleteByUserIdAndBookmarkKey(userId, bookmarkKey);
    }

    @Transactional
    public void recordStudyCompletion(Long userId, String subject, Integer answeredCount, Integer correctCount) {
        LearningProfile profile = getOrCreateProfile(userId);
        ObjectNode stats = readJsonObject(profile.getAchievementStatsJson()).deepCopy();
        LocalDateTime occurredAt = LocalDateTime.now();
        String activityDate = occurredAt.toLocalDate().toString();

        if (answeredCount != null && answeredCount > 0 && correctCount != null && correctCount >= answeredCount) {
            stats.put("hadPerfectStudy", true);
        }
        applyTimeBasedFlags(stats, occurredAt);
        appendSubject(stats, subject);
        stats.put("lastStudyDate", activityDate);
        if (activityDate.equals(stats.path("lastInterviewDate").asText(null))) {
            stats.put("didBothSameDay", true);
        }
        updateStreakStats(stats, occurredAt.toLocalDate());

        profile.updateAchievementStatsJson(writeJson(stats));
        learningProfileRepository.save(profile);
    }

    @Transactional
    public void recordInterviewCompletion(Long userId, LocalDateTime occurredAt) {
        LearningProfile profile = getOrCreateProfile(userId);
        ObjectNode stats = readJsonObject(profile.getAchievementStatsJson()).deepCopy();
        LocalDateTime effectiveTime = occurredAt != null ? occurredAt : LocalDateTime.now();
        String activityDate = effectiveTime.toLocalDate().toString();

        applyWeekendActivity(stats, effectiveTime.toLocalDate());
        stats.put("lastInterviewDate", activityDate);
        if (activityDate.equals(stats.path("lastStudyDate").asText(null))) {
            stats.put("didBothSameDay", true);
        }
        updateStreakStats(stats, effectiveTime.toLocalDate());

        profile.updateAchievementStatsJson(writeJson(stats));
        learningProfileRepository.save(profile);
    }

    private WrongNote createWrongNoteInternal(Long userId, CreateWrongNoteRequest request) {
        User user = getUser(userId);
        WrongNote wrongNote = WrongNote.builder()
                .user(user)
                .solvedDate(parseDate(request.date()))
                .subject(request.subject())
                .difficulty(request.difficulty())
                .question(request.question())
                .type(request.type())
                .choicesJson(writeJson(request.choices()))
                .answer(request.answer())
                .userAnswer(request.userAnswer())
                .aiFeedback(request.aiFeedback())
                .explanation(request.explanation())
                .build();
        return wrongNoteRepository.save(wrongNote);
    }

    private LearningProfile getOrCreateProfile(Long userId) {
        return learningProfileRepository.findByUserId(userId)
                .orElseGet(() -> learningProfileRepository.save(LearningProfile.builder()
                        .user(getUser(userId))
                        .placementDifficulty("MEDIUM")
                        .placementCompleted(false)
                        .totalAttempts(0)
                        .totalCorrectAnswers(0)
                        .achievementStatsJson("{}")
                        .build()));
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "User not found"));
    }

    private LearningOverviewResponse toLearningOverviewResponse(Long userId, LearningProfile profile) {
        return new LearningOverviewResponse(
                profile.getPlacementDifficulty(),
                profile.isPlacementCompleted(),
                getDailyUsed(userId),
                profile.getTotalAttempts(),
                calculateCorrectRate(profile),
                wrongNoteRepository.countByUserId(userId)
        );
    }

    private int getDailyUsed(Long userId) {
        return learningDailyUsageRepository.findByUserIdAndUsageDate(userId, LocalDate.now())
                .map(LearningDailyUsage::getUsedCount)
                .orElse(0);
    }

    private double calculateCorrectRate(LearningProfile profile) {
        if (profile.getTotalAttempts() <= 0) {
            return 0.0;
        }
        return Math.round(((double) profile.getTotalCorrectAnswers() / profile.getTotalAttempts()) * 1000.0) / 10.0;
    }

    private ObjectNode buildMergedAchievementStats(Long userId, LearningProfile profile, List<InterviewBookmarkResponse> bookmarks) {
        ObjectNode merged = readJsonObject(profile.getAchievementStatsJson()).deepCopy();
        List<InterviewSession> sessions = getCompletedSessions(userId);

        int totalInterviews = sessions.size();
        int bestScore = sessions.stream()
                .map(InterviewSession::getFeedback)
                .filter(Objects::nonNull)
                .map(feedback -> feedback.getOverallScore())
                .filter(Objects::nonNull)
                .max(Integer::compareTo)
                .orElse(0);

        merged.put("totalInterviews", totalInterviews);
        merged.put("bestScore", bestScore);
        merged.put("scoreImprovement", calculateScoreImprovement(sessions));
        merged.put("totalStudyProblems", profile.getTotalAttempts());
        merged.put("totalBookmarks", bookmarks.size());

        if (!sessions.isEmpty() && sessions.get(0).getStartedAt() != null) {
            merged.put("lastInterviewDate", sessions.get(0).getStartedAt().toLocalDate().toString());
        }

        return merged;
    }

    private AchievementStateResponse buildAchievementState(
            Long userId,
            LearningProfile profile,
            List<InterviewBookmarkResponse> bookmarks,
            boolean persistChanges
    ) {
        ObjectNode mergedStats = buildMergedAchievementStats(userId, profile, bookmarks);
        applyAchievementUnlocks(mergedStats);

        if (persistChanges) {
            ObjectNode storedStats = readJsonObject(profile.getAchievementStatsJson());
            if (!mergedStats.equals(storedStats)) {
                profile.updateAchievementStatsJson(writeJson(mergedStats));
                learningProfileRepository.save(profile);
            }
        }

        return new AchievementStateResponse(toMap(mergedStats), bookmarks);
    }

    private void applyAchievementUnlocks(ObjectNode stats) {
        ObjectNode unlockedAt = stats.with("unlockedAt");
        String unlockedAtTimestamp = LocalDateTime.now().toString();

        for (AchievementRule rule : ACHIEVEMENT_RULES) {
            if (unlockedAt.hasNonNull(rule.id())) {
                continue;
            }
            if (rule.condition().test(stats)) {
                unlockedAt.put(rule.id(), unlockedAtTimestamp);
            }
        }
    }

    private List<InterviewSession> getCompletedSessions(Long userId) {
        return interviewSessionRepository.findByUserIdOrderByStartedAtDesc(userId)
                .stream()
                .filter(session -> session.getStatus() == InterviewSessionStatus.COMPLETED)
                .toList();
    }

    private void applyTimeBasedFlags(ObjectNode stats, LocalDateTime occurredAt) {
        int hour = occurredAt.getHour();

        if (hour < 6) {
            stats.put("studiedEarlyMorning", true);
        }
        if (hour >= 0 && hour < 4) {
            stats.put("studiedLateNight", true);
        }
        if (hour >= 6 && hour < 9) {
            stats.put("morningStudy", true);
        }
        applyWeekendActivity(stats, occurredAt.toLocalDate());
    }

    private void applyWeekendActivity(ObjectNode stats, LocalDate activityDate) {
        int dayOfWeek = activityDate.getDayOfWeek().getValue();
        if (dayOfWeek == 6 || dayOfWeek == 7) {
            stats.put("weekendActivity", true);
        }
    }
    private void appendSubject(ObjectNode stats, String subject) {
        if (subject == null || subject.isBlank()) {
            return;
        }
        ArrayNode subjectsStudied = stats.withArray("subjectsStudied");
        boolean alreadyAdded = false;
        for (JsonNode item : subjectsStudied) {
            if (subject.equals(item.asText())) {
                alreadyAdded = true;
                break;
            }
        }
        if (!alreadyAdded) {
            subjectsStudied.add(subject);
        }
    }

    private void updateStreakStats(ObjectNode stats, LocalDate activityDate) {
        String today = activityDate.toString();
        String lastActivityDate = stats.path("lastActivityDate").asText(null);
        int currentStreak = stats.path("currentStreak").asInt(0);
        boolean cameBack = stats.path("cameBack").asBoolean(false);

        if (lastActivityDate == null || lastActivityDate.isBlank()) {
            currentStreak = 1;
        } else if (!today.equals(lastActivityDate)) {
            long diffDays = ChronoUnit.DAYS.between(LocalDate.parse(lastActivityDate), activityDate);
            if (diffDays == 1) {
                currentStreak += 1;
            } else {
                if (diffDays >= 7) {
                    cameBack = true;
                }
                currentStreak = 1;
            }
        }

        stats.put("currentStreak", currentStreak);
        stats.put("longestStreak", Math.max(stats.path("longestStreak").asInt(0), currentStreak));
        stats.put("cameBack", cameBack);
        stats.put("lastActivityDate", today);
    }

    private int calculateScoreImprovement(List<InterviewSession> sessions) {
        int bestScore = 0;
        int improvements = 0;

        for (InterviewSession session : sessions.stream().sorted(Comparator.comparing(InterviewSession::getStartedAt)).toList()) {
            if (session.getFeedback() == null || session.getFeedback().getOverallScore() == null) {
                continue;
            }
            int score = session.getFeedback().getOverallScore();
            if (score > bestScore) {
                bestScore = score;
                improvements += 1;
            }
        }

        return improvements;
    }

    private List<InterviewBookmarkResponse> listBookmarkResponses(Long userId) {
        return interviewBookmarkRepository.findByUserIdOrderByBookmarkedAtDescCreatedAtDesc(userId)
                .stream()
                .map(this::toInterviewBookmarkResponse)
                .toList();
    }

    private static int intStat(ObjectNode stats, String fieldName) {
        return stats.path(fieldName).asInt(0);
    }

    private static boolean booleanStat(ObjectNode stats, String fieldName) {
        return stats.path(fieldName).asBoolean(false);
    }

    private static int arraySize(ObjectNode stats, String fieldName) {
        JsonNode node = stats.path(fieldName);
        return node.isArray() ? node.size() : 0;
    }

    private record AchievementRule(String id, Predicate<ObjectNode> condition) {
    }

    private LearningProgressResponse toLearningProgressResponse(LearningProgress progress) {
        return new LearningProgressResponse(
                progress.getId(),
                progress.getSubject(),
                progress.getDifficulty(),
                progress.getTotalCount(),
                progress.getCurrentIndex(),
                toListOfMaps(readJsonArray(progress.getProblemsJson())),
                toMap(readJsonObject(progress.getUserAnswersJson())),
                toMap(readJsonObject(progress.getResultsJson())),
                progress.getUpdatedAt()
        );
    }

    private WrongNoteResponse toWrongNoteResponse(WrongNote wrongNote) {
        return new WrongNoteResponse(
                wrongNote.getId(),
                wrongNote.getSolvedDate() != null ? wrongNote.getSolvedDate().toString() : null,
                wrongNote.getSubject(),
                wrongNote.getDifficulty(),
                wrongNote.getQuestion(),
                wrongNote.getType(),
                toStringList(readJsonArray(wrongNote.getChoicesJson())),
                wrongNote.getAnswer(),
                wrongNote.getUserAnswer(),
                wrongNote.getAiFeedback(),
                wrongNote.getExplanation()
        );
    }

    private InterviewBookmarkResponse toInterviewBookmarkResponse(InterviewBookmark bookmark) {
        LocalDateTime bookmarkedAt = bookmark.getBookmarkedAt() != null ? bookmark.getBookmarkedAt() : bookmark.getCreatedAt();
        return new InterviewBookmarkResponse(
                bookmark.getBookmarkKey(),
                bookmark.getQuestionText(),
                bookmark.getAnswerText(),
                bookmark.getSessionId(),
                bookmarkedAt != null ? bookmarkedAt.toString() : null
        );
    }

    private String writeJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "JSON_SERIALIZE_FAILED", "Failed to serialize learning data");
        }
    }

    private ObjectNode toObjectNode(Object value) {
        if (value == null) {
            return JsonNodeFactory.instance.objectNode();
        }
        JsonNode node = objectMapper.valueToTree(value);
        if (node != null && node.isObject()) {
            return (ObjectNode) node;
        }
        return JsonNodeFactory.instance.objectNode();
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> toMap(ObjectNode node) {
        return objectMapper.convertValue(node, Map.class);
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> toListOfMaps(ArrayNode node) {
        return objectMapper.convertValue(node, List.class);
    }

    @SuppressWarnings("unchecked")
    private List<String> toStringList(ArrayNode node) {
        return objectMapper.convertValue(node, List.class);
    }

    private ObjectNode readJsonObject(String value) {
        JsonNode node = readJson(value);
        if (node != null && node.isObject()) {
            return (ObjectNode) node;
        }
        return JsonNodeFactory.instance.objectNode();
    }

    private ArrayNode readJsonArray(String value) {
        JsonNode node = readJson(value);
        if (node != null && node.isArray()) {
            return (ArrayNode) node;
        }
        return JsonNodeFactory.instance.arrayNode();
    }

    private JsonNode readJson(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return objectMapper.readTree(value);
        } catch (Exception e) {
            return null;
        }
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return LocalDate.now();
        }
        try {
            return LocalDate.parse(value);
        } catch (DateTimeParseException e) {
            return LocalDate.now();
        }
    }

    private LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) {
            return LocalDateTime.now();
        }
        try {
            return LocalDateTime.parse(value);
        } catch (DateTimeParseException e) {
            return LocalDateTime.now();
        }
    }
}
