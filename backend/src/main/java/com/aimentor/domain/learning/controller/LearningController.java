package com.aimentor.domain.learning.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.external.ai.AiIntegrationProperties;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

@RestController
@RequestMapping("/api/learning")
public class LearningController {

    private final RestTemplate restTemplate;
    private final String aiBaseUrl;

    public LearningController(AiIntegrationProperties properties) {
        this.restTemplate = new RestTemplate();
        this.aiBaseUrl = properties.baseUrl();
    }

    @PostMapping(value = "/generate/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter generateStream(@RequestBody GenerateRequest request) {
        SseEmitter emitter = new SseEmitter(120_000L);

        String type = request.type() != null ? request.type() : "MIX";
        String requestJson = String.format(
                "{\"subject\":\"%s\",\"difficulty\":\"%s\",\"count\":%d,\"type\":\"%s\"}",
                request.subject().replace("\"", "\\\""),
                request.difficulty().replace("\"", "\\\""),
                request.count(),
                type.replace("\"", "\\\"")
        );

        final String finalJson = requestJson;
        new Thread(() -> {
            try {
                HttpClient httpClient = HttpClient.newBuilder()
                        .version(HttpClient.Version.HTTP_1_1)
                        .build();
                HttpRequest httpRequest = HttpRequest.newBuilder()
                        .uri(URI.create(aiBaseUrl + "/learning/generate/stream"))
                        .header("Content-Type", "application/json")
                        .POST(HttpRequest.BodyPublishers.ofString(finalJson, StandardCharsets.UTF_8))
                        .build();

                HttpResponse<java.util.stream.Stream<String>> response = httpClient.send(
                        httpRequest, HttpResponse.BodyHandlers.ofLines());

                response.body().forEach(line -> {
                    if (line.startsWith("data:")) {
                        String data = line.replaceFirst("^data:\\s*", "").trim();
                        if (!"[DONE]".equals(data)) {
                            try {
                                emitter.send(SseEmitter.event().data(data, MediaType.APPLICATION_JSON));
                            } catch (IOException e) {
                                throw new RuntimeException(e);
                            }
                        }
                    }
                });
                emitter.complete();
            } catch (Exception e) {
                emitter.completeWithError(e);
            }
        }).start();

        return emitter;
    }

    @PostMapping("/generate")
    public ApiResponse<ProblemsResponse> generate(@RequestBody GenerateRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "subject", request.subject(),
                "difficulty", request.difficulty(),
                "count", request.count(),
                "type", request.type() != null ? request.type() : "MIX"
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        ProblemsResponse response = restTemplate.postForObject(
                aiBaseUrl + "/learning/generate", entity, ProblemsResponse.class);
        return ApiResponse.success(response);
    }

    @PostMapping("/attempts")
    public ApiResponse<GradeResponse> attempt(@RequestBody GradeRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = new HashMap<>();
        body.put("question", request.question());
        body.put("correctAnswer", request.correctAnswer());
        body.put("userAnswer", request.userAnswer());
        body.put("explanation", request.explanation() != null ? request.explanation() : "");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        GradeResponse response = restTemplate.postForObject(
                aiBaseUrl + "/learning/grade", entity, GradeResponse.class);
        return ApiResponse.success(response);
    }

    @PostMapping("/placement/generate")
    public ApiResponse<PlacementResponse> placementGenerate(@RequestBody PlacementGenerateRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of("count", request.count());

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        PlacementResponse response = restTemplate.postForObject(
                aiBaseUrl + "/learning/placement/generate", entity, PlacementResponse.class);
        return ApiResponse.success(response);
    }

    @GetMapping("/stats")
    public ApiResponse<Map<String, Object>> stats() {
        return ApiResponse.success(Map.of("totalAttempts", 0, "correctRate", 0.0));
    }

    @PostMapping("/hint")
    public ApiResponse<HintResponse> hint(@RequestBody HintRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> body = Map.of(
                "question", request.question(),
                "choices", request.choices(),
                "subject", request.subject() != null ? request.subject() : "",
                "difficulty", request.difficulty() != null ? request.difficulty() : "MEDIUM"
        );

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
        HintResponse response = restTemplate.postForObject(
                aiBaseUrl + "/learning/hint", entity, HintResponse.class);
        return ApiResponse.success(response);
    }

    record GenerateRequest(String subject, String difficulty, int count, String type) {}
    record Problem(String type, String question, List<String> choices, String answer, String explanation) {}
    record ProblemsResponse(List<Problem> problems) {}
    record GradeRequest(String question, String correctAnswer, String userAnswer, String explanation) {}
    record GradeResponse(boolean isCorrect, String aiFeedback) {}
    record HintRequest(String question, List<String> choices, String subject, String difficulty) {}
    record HintResponse(String hint) {}
    record PlacementGenerateRequest(int count) {}
    record PlacementProblem(String subject, int level, String question, List<String> choices, String answer) {}
    record PlacementResponse(List<PlacementProblem> problems) {}
}
