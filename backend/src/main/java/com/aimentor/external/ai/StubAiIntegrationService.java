package com.aimentor.external.ai;

import com.aimentor.external.ai.dto.*;

import java.util.ArrayList;
import java.util.List;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.stereotype.Service;

@Service
@ConditionalOnMissingBean(AiIntegrationService.class)
public class StubAiIntegrationService implements AiIntegrationService {

    private final AiIntegrationProperties properties;

    public StubAiIntegrationService(AiIntegrationProperties properties) {
        this.properties = properties;
    }

    @Override
    public AiGenerateInterviewQuestionsResponse generateInterviewQuestions(AiGenerateInterviewQuestionsRequest request) {
        List<AiQuestionItem> questions = new ArrayList<>();
        int questionCount = request == null ? 1 : Math.max(1, request.questionCount());
        String positionTitle = request == null || request.positionTitle() == null || request.positionTitle().isBlank()
                ? "직무명 없음 (Stub)"
                : request.positionTitle();
        for (int index = 1; index <= questionCount; index++) {
            questions.add(new AiQuestionItem(
                    index,
                    "Stub question " + index + " for " + positionTitle + ". Replace with real AI provider output."
            ));
        }

        // Real provider integration will call the selected AI SDK or HTTP API here.
        return new AiGenerateInterviewQuestionsResponse(questions, resolveProviderName(), true);
    }

    @Override
    public AiAnalyzeAnswerFeedbackResponse analyzeAnswerFeedback(AiAnalyzeAnswerFeedbackRequest request) {
        int answerLength = request == null || request.answerText() == null ? 0 : request.answerText().trim().length();
        int relevanceScore = Math.min(100, 50 + (answerLength / 20));
        int logicScore = Math.min(100, 45 + (answerLength / 25));
        int specificityScore = Math.min(100, 40 + (answerLength / 18));
        int overallScore = Math.round((relevanceScore + logicScore + specificityScore) / 3.0f);

        // Real provider integration will send prompt/context and parse structured scoring here.
        return new AiAnalyzeAnswerFeedbackResponse(
                relevanceScore,
                logicScore,
                specificityScore,
                overallScore,
                "Stub feedback generated from a simple local heuristic. Replace with provider analysis.",
                resolveProviderName(),
                true
        );
    }

    @Override
    public AiGenerateReportSummaryResponse generateReportSummary(AiGenerateReportSummaryRequest request) {
        return new AiGenerateReportSummaryResponse(
                "답변에서 구체적인 수치나 사례가 부족했습니다. (Stub)",
                "STAR 기법으로 경험을 구체화해보세요. (Stub)",
                "저는 ~프로젝트에서 ~문제를 해결했습니다. 구체적으로는... (Stub)",
                resolveProviderName(),
                true
        );
    }

    @Override
    public AiParseJobPostingResponse parseJobPosting(AiParseJobPostingRequest request) {
        // Return a safe stub response instead of null to avoid NPEs in callers.
        String defaultCompany = "회사명 없음 (Stub)";
        String defaultPosition = request == null || request.url() == null || request.url().isBlank()
                ? "직무명 없음 (Stub)"
                : "직무명 (Stub)";
        String defaultDescription = "채용공고 내용이 없습니다. URL 또는 내용을 입력해 주세요. (Stub)";

        if (request != null && request.content() != null && !request.content().isBlank()) {
            defaultDescription = request.content().length() > 200
                    ? request.content().substring(0, 200) + "... (Stub: 요약)"
                    : request.content() + " (Stub: 원문 일부)";
        }

        return new AiParseJobPostingResponse(defaultCompany, defaultPosition, defaultDescription);
    }

    private String resolveProviderName() {
        return properties.provider() == null || properties.provider().isBlank()
                ? "stub-ai"
                : properties.provider();
    }
}
