package com.aimentor.domain.learning.controller;

import com.aimentor.domain.interview.entity.InterviewFeedback;
import com.aimentor.domain.interview.entity.InterviewSession;
import com.aimentor.domain.interview.entity.InterviewSessionStatus;
import com.aimentor.domain.interview.repository.InterviewSessionRepository;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret-key=test-secret-key-test-secret-key-test-secret-key",
        "jwt.access-token-expiration-seconds=1800",
        "jwt.refresh-token-expiration-seconds=1209600"
})
@AutoConfigureMockMvc
class LearningDataControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private InterviewSessionRepository interviewSessionRepository;

    @Test
    void migrationFlowShouldPersistLegacyLikeLearningData() throws Exception {
        String accessToken = signupAndGetAccessToken("learning-migration@example.com");

        mockMvc.perform(put("/api/learning/preferences")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "placementDifficulty": "HARD",
                                  "placementDone": true,
                                  "dailyUsed": 12
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.placementDifficulty").value("HARD"))
                .andExpect(jsonPath("$.data.placementDone").value(true))
                .andExpect(jsonPath("$.data.dailyUsed").value(12));

        mockMvc.perform(put("/api/learning/progress")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subject": "Java",
                                  "difficulty": "HARD",
                                  "count": 5,
                                  "currentIdx": 1,
                                  "problems": [
                                    { "question": "Q1", "answer": "A1" },
                                    { "question": "Q2", "answer": "A2" }
                                  ],
                                  "userAnswers": { "0": "A1" },
                                  "results": { "0": { "isCorrect": true, "userAnswer": "A1" } }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.subject").value("Java"))
                .andExpect(jsonPath("$.data.currentIdx").value(1));

        mockMvc.perform(post("/api/learning/wrong-notes")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "date": "2026-03-20",
                                  "subject": "Java",
                                  "difficulty": "HARD",
                                  "question": "JVM stands for?",
                                  "type": "MULTIPLE",
                                  "choices": ["Java Virtual Machine", "Java Vendor Model"],
                                  "answer": "Java Virtual Machine",
                                  "userAnswer": "Java Vendor Model",
                                  "aiFeedback": "Review JVM basics",
                                  "explanation": "JVM means Java Virtual Machine"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.question").value("JVM stands for?"));

        mockMvc.perform(post("/api/learning/bookmarks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "bookmark-1",
                                  "questionText": "Tell me about JVM",
                                  "answerText": "JVM runs Java bytecode",
                                  "sessionId": "session-1",
                                  "date": "2026-03-20T10:15:00"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value("bookmark-1"));

        mockMvc.perform(put("/api/learning/achievement-state")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "stats": {
                                    "totalStudyProblems": 9,
                                    "currentStreak": 2,
                                    "longestStreak": 2,
                                    "subjectsStudied": ["Java"],
                                    "lastStudyDate": "2026-03-20"
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalStudyProblems").value(9))
                .andExpect(jsonPath("$.data.stats.totalBookmarks").value(1))
                .andExpect(jsonPath("$.data.stats.unlockedAt.first_study").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.first_bookmark").isNotEmpty());

        mockMvc.perform(get("/api/learning/overview")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.placementDifficulty").value("HARD"))
                .andExpect(jsonPath("$.data.placementDone").value(true))
                .andExpect(jsonPath("$.data.dailyUsed").value(12))
                .andExpect(jsonPath("$.data.totalAttempts").value(9))
                .andExpect(jsonPath("$.data.wrongNotesCount").value(1));

        mockMvc.perform(get("/api/learning/progress")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].subject").value("Java"))
                .andExpect(jsonPath("$.data[0].difficulty").value("HARD"));

        mockMvc.perform(get("/api/learning/wrong-notes")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].subject").value("Java"));
    }

    @Test
    void dashboardSummaryShouldAggregateInterviewAndLearningDataFromServer() throws Exception {
        String email = "learning-dashboard@example.com";
        String accessToken = signupAndGetAccessToken(email);
        User user = userRepository.findByEmail(email).orElseThrow();

        createInterviewSession(user, "First interview", LocalDateTime.now().minusDays(2), 60);
        createInterviewSession(user, "Second interview", LocalDateTime.now().minusDays(1), 80);

        mockMvc.perform(post("/api/learning/session-results")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "subject": "Spring",
                                  "answeredCount": 10,
                                  "correctCount": 7,
                                  "wrongNotes": [
                                    {
                                      "date": "2026-03-21",
                                      "subject": "Spring",
                                      "difficulty": "MEDIUM",
                                      "question": "What is DI?",
                                      "type": "SHORT",
                                      "choices": [],
                                      "answer": "Dependency Injection",
                                      "userAnswer": "Data Import",
                                      "aiFeedback": "Review IoC",
                                      "explanation": "DI is Dependency Injection"
                                    }
                                  ]
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/learning/preferences")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "dailyUsed": 12
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(put("/api/learning/achievement-state")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "stats": {
                                    "currentStreak": 4,
                                    "longestStreak": 8
                                  }
                                }
                                """))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/learning/dashboard-summary")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalInterviews").value(2))
                .andExpect(jsonPath("$.data.averageInterviewScore").value(70))
                .andExpect(jsonPath("$.data.latestInterviewScore").value(80))
                .andExpect(jsonPath("$.data.previousInterviewScore").value(60))
                .andExpect(jsonPath("$.data.scoreTrend").value(20))
                .andExpect(jsonPath("$.data.bestInterviewScore").value(80))
                .andExpect(jsonPath("$.data.totalStudyProblems").value(10))
                .andExpect(jsonPath("$.data.correctRate").value(70.0))
                .andExpect(jsonPath("$.data.wrongNotesCount").value(1))
                .andExpect(jsonPath("$.data.currentStreak").value(4))
                .andExpect(jsonPath("$.data.longestStreak").value(8))
                .andExpect(jsonPath("$.data.dailyUsed").value(12));
    }

    @Test
    void achievementStateShouldUnlockOnServerAndPersistUnlockedAt() throws Exception {
        String email = "learning-achievements@example.com";
        String accessToken = signupAndGetAccessToken(email);
        User user = userRepository.findByEmail(email).orElseThrow();

        createInterviewSession(user, "Interview 1", LocalDateTime.now().minusDays(3), 70);
        createInterviewSession(user, "Interview 2", LocalDateTime.now().minusDays(2), 80);
        createInterviewSession(user, "Interview 3", LocalDateTime.now().minusDays(1), 90);

        mockMvc.perform(post("/api/learning/bookmarks")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "id": "bookmark-locked",
                                  "questionText": "Explain JVM",
                                  "answerText": "It runs bytecode",
                                  "sessionId": "session-locked",
                                  "date": "2026-03-22T09:30:00"
                                }
                                """))
                .andExpect(status().isOk());

        MvcResult updateResult = mockMvc.perform(put("/api/learning/achievement-state")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "stats": {
                                    "totalStudyProblems": 50,
                                    "currentStreak": 7,
                                    "longestStreak": 7,
                                    "hadPerfectStudy": true,
                                    "subjectsStudied": ["Java", "Spring", "SQL"],
                                    "studiedEarlyMorning": true,
                                    "morningStudy": true,
                                    "studiedLateNight": true,
                                    "didBothSameDay": true,
                                    "weekendActivity": true,
                                    "cameBack": true
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalInterviews").value(3))
                .andExpect(jsonPath("$.data.stats.bestScore").value(90))
                .andExpect(jsonPath("$.data.stats.scoreImprovement").value(3))
                .andExpect(jsonPath("$.data.stats.unlockedAt.first_interview").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.interview_3").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.score_90").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.study_50").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.perfect_study").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.multi_subject_3").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.streak_7").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.first_bookmark").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.early_bird").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.morning_routine").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.night_owl").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.all_rounder").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.weekend_warrior").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.comeback").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.score_improver").isNotEmpty())
                .andReturn();

        JsonNode updateResponse = objectMapper.readTree(updateResult.getResponse().getContentAsString());
        String firstInterviewUnlockedAt = updateResponse.path("data").path("stats").path("unlockedAt").path("first_interview").asText();
        assertThat(firstInterviewUnlockedAt).isNotBlank();
        assertThat(updateResponse.path("data").path("stats").path("unlockedAt").has("score_100")).isFalse();

        MvcResult getResult = mockMvc.perform(get("/api/learning/achievement-state")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode getResponse = objectMapper.readTree(getResult.getResponse().getContentAsString());
        assertThat(getResponse.path("data").path("stats").path("unlockedAt").path("first_interview").asText())
                .isEqualTo(firstInterviewUnlockedAt);
    }

    private String signupAndGetAccessToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "Learning User",
                                  "email": "%s",
                                  "password": "password1"
                                }
                                """.formatted(email)))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        String accessToken = response.path("data").path("accessToken").asText();
        assertThat(accessToken).isNotBlank();
        return accessToken;
    }

    private void createInterviewSession(User user, String title, LocalDateTime startedAt, int overallScore) {
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

    private String bearerToken(String accessToken) {
        return "Bearer " + accessToken;
    }
}
