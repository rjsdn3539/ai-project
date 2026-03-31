package com.aimentor.domain.learning.service;

import com.aimentor.domain.interview.entity.InterviewFeedback;
import com.aimentor.domain.interview.entity.InterviewSession;
import com.aimentor.domain.interview.entity.InterviewSessionStatus;
import com.aimentor.domain.interview.repository.InterviewSessionRepository;
import com.aimentor.domain.learning.dto.request.SubmitLearningSessionResultRequest;
import com.aimentor.domain.learning.dto.response.AchievementStateResponse;
import com.aimentor.domain.learning.entity.LearningProfile;
import com.aimentor.domain.learning.repository.LearningProfileRepository;
import com.aimentor.domain.user.entity.Role;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret-key=test-secret-key-test-secret-key-test-secret-key",
        "jwt.access-token-expiration-seconds=1800",
        "jwt.refresh-token-expiration-seconds=1209600"
})
class LearningDataServiceIntegrationTest {

    @Autowired
    private LearningDataService learningDataService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private LearningProfileRepository learningProfileRepository;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void studyAndInterviewEventsShouldUpdateSameDayAndStreakAchievements() throws Exception {
        User user = createUser("service-achievement-same-day@example.com");
        LocalDate today = LocalDate.now();

        learningProfileRepository.save(LearningProfile.builder()
                .user(user)
                .placementDifficulty("MEDIUM")
                .placementCompleted(false)
                .totalAttempts(0)
                .totalCorrectAnswers(0)
                .achievementStatsJson(objectMapper.writeValueAsString(Map.of(
                        "currentStreak", 2,
                        "longestStreak", 2,
                        "lastActivityDate", today.minusDays(1).toString()
                )))
                .build());

        learningDataService.submitSessionResult(
                user.getId(),
                new SubmitLearningSessionResultRequest("Java", 5, 5, List.of())
        );
        createCompletedInterviewSession(user, "Same day interview", today.atTime(14, 0), 82);
        learningDataService.recordInterviewCompletion(user.getId(), today.atTime(14, 30));

        AchievementStateResponse response = learningDataService.getAchievementState(user.getId());
        Map<String, Object> stats = response.stats();
        Map<String, Object> unlockedAt = nestedMap(stats, "unlockedAt");

        assertThat(intStat(stats, "totalStudyProblems")).isEqualTo(5);
        assertThat(intStat(stats, "totalInterviews")).isEqualTo(1);
        assertThat(intStat(stats, "currentStreak")).isEqualTo(3);
        assertThat(intStat(stats, "longestStreak")).isEqualTo(3);
        assertThat(booleanStat(stats, "didBothSameDay")).isTrue();
        assertThat(booleanStat(stats, "hadPerfectStudy")).isTrue();
        assertThat(stringList(stats, "subjectsStudied")).contains("Java");
        assertThat(unlockedAt).containsKeys("first_study", "streak_3", "first_interview", "all_rounder", "perfect_study");
    }

    @Test
    void weekendInterviewEventShouldMarkWeekendActivityAndComeback() throws Exception {
        User user = createUser("service-achievement-weekend@example.com");
        LocalDate weekendDate = LocalDate.now().with(TemporalAdjusters.nextOrSame(DayOfWeek.SATURDAY));

        learningProfileRepository.save(LearningProfile.builder()
                .user(user)
                .placementDifficulty("MEDIUM")
                .placementCompleted(false)
                .totalAttempts(0)
                .totalCorrectAnswers(0)
                .achievementStatsJson(objectMapper.writeValueAsString(Map.of(
                        "currentStreak", 4,
                        "longestStreak", 4,
                        "lastActivityDate", weekendDate.minusDays(8).toString()
                )))
                .build());

        createCompletedInterviewSession(user, "Weekend interview", weekendDate.atTime(10, 0), 77);
        learningDataService.recordInterviewCompletion(user.getId(), weekendDate.atTime(10, 30));

        AchievementStateResponse response = learningDataService.getAchievementState(user.getId());
        Map<String, Object> stats = response.stats();
        Map<String, Object> unlockedAt = nestedMap(stats, "unlockedAt");

        assertThat(intStat(stats, "totalInterviews")).isEqualTo(1);
        assertThat(intStat(stats, "currentStreak")).isEqualTo(1);
        assertThat(intStat(stats, "longestStreak")).isEqualTo(4);
        assertThat(booleanStat(stats, "weekendActivity")).isTrue();
        assertThat(booleanStat(stats, "cameBack")).isTrue();
        assertThat(unlockedAt).containsKeys("first_interview", "weekend_warrior", "comeback");
    }

    private User createUser(String email) {
        return userRepository.save(User.builder()
                .name("Learning Service User")
                .email(email)
                .password("encoded-password")
                .role(Role.USER)
                .build());
    }

    private void createCompletedInterviewSession(User user, String title, LocalDateTime startedAt, int overallScore) {
        InterviewSession session = InterviewSession.builder()
                .user(user)
                .title(title)
                .positionTitle("Backend Engineer")
                .status(InterviewSessionStatus.COMPLETED)
                .startedAt(startedAt)
                .build();

        InterviewFeedback feedback = InterviewFeedback.builder()
                .interviewSession(session)
                .relevanceScore(overallScore)
                .logicScore(overallScore)
                .specificityScore(overallScore)
                .overallScore(overallScore)
                .summary("Summary")
                .weakPoints("Weak points")
                .improvements("Improvements")
                .recommendedAnswer("Recommended answer")
                .build();

        session.assignFeedback(feedback);
        interviewSessionRepository.saveAndFlush(session);
    }

    private int intStat(Map<String, Object> stats, String key) {
        Object value = stats.get(key);
        return value instanceof Number number ? number.intValue() : 0;
    }

    private boolean booleanStat(Map<String, Object> stats, String key) {
        Object value = stats.get(key);
        return value instanceof Boolean bool && bool;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> nestedMap(Map<String, Object> stats, String key) {
        Object value = stats.get(key);
        return value instanceof Map<?, ?> map ? (Map<String, Object>) map : Map.of();
    }

    @SuppressWarnings("unchecked")
    private List<String> stringList(Map<String, Object> stats, String key) {
        Object value = stats.get(key);
        return value instanceof List<?> list ? (List<String>) list : List.of();
    }
}
