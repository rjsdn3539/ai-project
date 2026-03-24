package com.aimentor.external.ai;

import com.aimentor.common.exception.AiServiceException;
import com.aimentor.external.ai.dto.FeedbackDto;
import com.aimentor.external.ai.dto.GradeResultDto;
import com.aimentor.external.ai.dto.ProblemDto;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Python FastAPI 서버를 실제로 호출하는 구현체
 * application.yml: ai.service.mock=false  → 이 빈이 활성화됨
 * Python 서버 주소: application.yml의 ai.server.url
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "ai.service.mock", havingValue = "false")
@RequiredArgsConstructor
public class PythonAiService implements AiService {

    private final WebClient webClient;

    @Value("${ai.server.url}")
    private String aiServerUrl;

    @Override
    public String generateInterviewQuestion(String resumeContent, String coverLetterContent,
                                            String jobDescription, List<QAHistory> history) {
        // TODO: history → [{"question":"...", "answer":"..."}] 형식으로 변환
        Map<String, Object> body = new HashMap<>();
        body.put("resumeContent", resumeContent);
        body.put("coverLetterContent", coverLetterContent);
        body.put("jobDescription", jobDescription);
        body.put("conversationHistory", history);

        try {
            Map<String, String> resp = webClient.post()
                    .uri(aiServerUrl + "/interview/question")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, String>>() {})
                    .block();
            return resp != null ? resp.get("question") : "";
        } catch (WebClientResponseException e) {
            log.error("AI 서버 오류: {}", e.getMessage());
            throw new AiServiceException("면접 질문 생성에 실패했습니다.");
        }
    }

    @Override
    public FeedbackDto generateFeedback(List<QAHistory> history) {
        Map<String, Object> body = Map.of("conversationHistory", history);
        try {
            return webClient.post()
                    .uri(aiServerUrl + "/interview/feedback")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(FeedbackDto.class)
                    .block();
        } catch (WebClientResponseException e) {
            log.error("AI 서버 오류: {}", e.getMessage());
            throw new AiServiceException("피드백 생성에 실패했습니다.");
        }
    }

    @Override
    public List<ProblemDto> generateLearningProblems(String subject, String difficulty, int count) {
        Map<String, Object> body = Map.of(
                "subject", subject, "difficulty", difficulty, "count", count, "type", "MIX");
        try {
            Map<String, List<ProblemDto>> resp = webClient.post()
                    .uri(aiServerUrl + "/learning/generate")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(new ParameterizedTypeReference<Map<String, List<ProblemDto>>>() {})
                    .block();
            return resp != null ? resp.get("problems") : List.of();
        } catch (WebClientResponseException e) {
            throw new AiServiceException("학습 문제 생성에 실패했습니다.");
        }
    }

    @Override
    public GradeResultDto gradeLearningAnswer(String question, String correctAnswer, String userAnswer) {
        Map<String, String> body = Map.of(
                "question", question, "correctAnswer", correctAnswer, "userAnswer", userAnswer);
        try {
            return webClient.post()
                    .uri(aiServerUrl + "/learning/grade")
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(GradeResultDto.class)
                    .block();
        } catch (WebClientResponseException e) {
            throw new AiServiceException("답변 채점에 실패했습니다.");
        }
    }
}
