package com.aimentor.external.ai;

import com.aimentor.external.ai.dto.AiAnalyzeAnswerFeedbackRequest;
import com.aimentor.external.ai.dto.AiAnalyzeAnswerFeedbackResponse;
import com.aimentor.external.ai.dto.AiGenerateInterviewQuestionsRequest;
import com.aimentor.external.ai.dto.AiGenerateInterviewQuestionsResponse;
import com.aimentor.external.ai.dto.AiGenerateReportSummaryRequest;
import com.aimentor.external.ai.dto.AiGenerateReportSummaryResponse;
import com.aimentor.external.ai.dto.AiParseJobPostingRequest;
import com.aimentor.external.ai.dto.AiParseJobPostingResponse;
import com.aimentor.external.ai.dto.AiQuestionItem;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

public class HttpAiIntegrationService implements AiIntegrationService {

    private static final Logger log = LoggerFactory.getLogger(HttpAiIntegrationService.class);

    private final String baseUrl;
    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public HttpAiIntegrationService(String baseUrl, ObjectMapper objectMapper) {
        log.info("HttpAiIntegrationService 초기화 - baseUrl: {}", baseUrl);
        this.baseUrl = baseUrl;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
        this.objectMapper = objectMapper;
    }

    @Override
    public AiGenerateInterviewQuestionsResponse generateInterviewQuestions(AiGenerateInterviewQuestionsRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("positionTitle", request.positionTitle());
        body.put("resumeSummary", request.resumeSummary() != null ? request.resumeSummary() : "");
        body.put("jobDescription", request.jobDescription() != null ? request.jobDescription() : "");
        body.put("questionCount", request.questionCount());

        JsonNode response = postJson("/interview/questions/batch", body);

        List<AiQuestionItem> questions = new ArrayList<>();
        for (JsonNode q : response.get("questions")) {
            questions.add(new AiQuestionItem(q.get("sequenceNumber").intValue(), q.get("questionText").asString()));
        }

        return new AiGenerateInterviewQuestionsResponse(questions, "python-ai", false);
    }

    @Override
    public AiAnalyzeAnswerFeedbackResponse analyzeAnswerFeedback(AiAnalyzeAnswerFeedbackRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("questionText", request.questionText() != null ? request.questionText() : "");
        body.put("answerText", request.answerText() != null ? request.answerText() : "");
        body.put("jobDescription", request.jobDescription() != null ? request.jobDescription() : "");

        JsonNode response = postJson("/interview/answer/analyze", body);

        return new AiAnalyzeAnswerFeedbackResponse(
                response.get("relevanceScore").intValue(),
                response.get("logicScore").intValue(),
                response.get("specificityScore").intValue(),
                response.get("overallScore").intValue(),
                response.get("feedbackSummary").asString(),
                "python-ai",
                false
        );
    }

    @Override
    public AiGenerateReportSummaryResponse generateReportSummary(AiGenerateReportSummaryRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("sessionTitle", request.sessionTitle() != null ? request.sessionTitle() : "");
        body.put("positionTitle", request.positionTitle() != null ? request.positionTitle() : "");
        body.put("answerFeedback", request.answerFeedback() != null ? request.answerFeedback() : List.of());

        JsonNode response = postJson("/interview/report/summary", body);

        return new AiGenerateReportSummaryResponse(
                response.get("weakPoints").asString(),
                response.get("improvements").asString(),
                response.get("recommendedAnswer").asString(),
                "python-ai",
                false
        );
    }

    @Override
    public AiParseJobPostingResponse parseJobPosting(AiParseJobPostingRequest request) {
        Map<String, Object> body = new LinkedHashMap<>();
        if (request.url() != null && !request.url().isBlank()) body.put("url", request.url());
        if (request.content() != null && !request.content().isBlank()) body.put("content", request.content());

        JsonNode response = postJson("/interview/job-posting/parse", body);

        return new AiParseJobPostingResponse(
                response.get("companyName").asString(),
                response.get("positionTitle").asString(),
                response.get("description").asString()
        );
    }

    private JsonNode postJson(String path, Map<String, Object> body) {
        try {
            String requestJson = objectMapper.writeValueAsString(body);
            log.debug("AI 서버 요청 [{}]: {}", path, requestJson);

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(baseUrl + path))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(requestJson, java.nio.charset.StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> httpResponse = httpClient.send(
                    httpRequest, HttpResponse.BodyHandlers.ofString(java.nio.charset.StandardCharsets.UTF_8));

            log.debug("AI 서버 응답 [{}] status={}: {}", path, httpResponse.statusCode(), httpResponse.body());

            if (httpResponse.statusCode() != 200) {
                throw new RuntimeException("AI 서버 오류 (status=" + httpResponse.statusCode() + "): " + httpResponse.body());
            }

            return objectMapper.readTree(httpResponse.body());
        } catch (Exception e) {
            log.error("AI 서버 호출 실패 [{}]: {} - {}", path, e.getClass().getSimpleName(), e.getMessage(), e);
            throw new RuntimeException("AI 서버 호출 실패: " + e.getMessage(), e);
        }
    }
}
