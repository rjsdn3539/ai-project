package com.aimentor.domain.interview.controller;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = {
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "jwt.secret-key=test-secret-key-test-secret-key-test-secret-key",
        "jwt.access-token-expiration-seconds=1800",
        "jwt.refresh-token-expiration-seconds=1209600"
})
@AutoConfigureMockMvc
class InterviewSessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void interviewSessionLifecycleShouldWork() throws Exception {
        String accessToken = signupAndGetAccessToken("interview@example.com");
        Long resumeId = createProfileDocument(
                accessToken,
                "/api/v1/profiles/resumes",
                """
                        {
                          "title": "Backend Resume",
                          "content": "Built Spring Boot services and REST APIs."
                        }
                        """
        );
        Long coverLetterId = createProfileDocument(
                accessToken,
                "/api/v1/profiles/cover-letters",
                """
                        {
                          "title": "Backend Cover Letter",
                          "companyName": "AI Mentor",
                          "content": "I want to join as a backend engineer."
                        }
                        """
        );
        Long jobPostingId = createProfileDocument(
                accessToken,
                "/api/v1/profiles/job-postings",
                """
                        {
                          "companyName": "AI Mentor",
                          "positionTitle": "Backend Engineer",
                          "description": "Build interview platform APIs.",
                          "jobUrl": "https://example.com/jobs/backend-engineer"
                        }
                        """
        );

        MvcResult startResult = mockMvc.perform(post("/api/v1/interviews/sessions")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "title": "Backend Mock Interview",
                                  "positionTitle": "Backend Engineer",
                                  "resumeId": %d,
                                  "coverLetterId": %d,
                                  "jobPostingId": %d,
                                  "questionCount": 2
                                }
                                """.formatted(resumeId, coverLetterId, jobPostingId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("IN_PROGRESS"))
                .andExpect(jsonPath("$.data.questions.length()").value(2))
                .andReturn();

        JsonNode startResponse = objectMapper.readTree(startResult.getResponse().getContentAsString());
        Long sessionId = startResponse.path("data").path("id").asLong();
        Long questionId = startResponse.path("data").path("questions").get(0).path("id").asLong();

        mockMvc.perform(post("/api/v1/interviews/sessions/{sessionId}/answers", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "questionId": %d,
                                  "answerText": "I have built several Spring Boot services.",
                                  "audioUrl": "https://example.com/audio/answer1.wav"
                                }
                                """.formatted(questionId)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.answerText").value("I have built several Spring Boot services."))
                .andExpect(jsonPath("$.data.audioUrl").value("https://example.com/audio/answer1.wav"));

        mockMvc.perform(get("/api/v1/interviews/sessions/{sessionId}", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.questions[0].answer.answerText").value("I have built several Spring Boot services."));

        mockMvc.perform(post("/api/v1/interviews/sessions/{sessionId}/end", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("COMPLETED"))
                .andExpect(jsonPath("$.data.feedback.overallScore").isNumber());

        mockMvc.perform(get("/api/learning/achievement-state")
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.stats.totalInterviews").value(1))
                .andExpect(jsonPath("$.data.stats.lastInterviewDate").isNotEmpty())
                .andExpect(jsonPath("$.data.stats.unlockedAt.first_interview").isNotEmpty());

        mockMvc.perform(get("/api/v1/interviews/sessions/{sessionId}/report", sessionId)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionId").value(sessionId))
                .andExpect(jsonPath("$.data.feedback.summary").isNotEmpty())
                .andExpect(jsonPath("$.data.feedback.overallScore").isNumber())
                .andExpect(jsonPath("$.data.feedback.logicScore").isNumber())
                .andExpect(jsonPath("$.data.feedback.relevanceScore").isNumber())
                .andExpect(jsonPath("$.data.feedback.specificityScore").isNumber());
    }

    private String signupAndGetAccessToken(String email) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                  "name": "면접 사용자",
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

    private String bearerToken(String accessToken) {
        return "Bearer " + accessToken;
    }

    private Long createProfileDocument(String accessToken, String uri, String requestBody) throws Exception {
        MvcResult result = mockMvc.perform(post(uri)
                        .header(HttpHeaders.AUTHORIZATION, bearerToken(accessToken))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(requestBody))
                .andExpect(status().isOk())
                .andReturn();

        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return response.path("data").path("id").asLong();
    }
}
