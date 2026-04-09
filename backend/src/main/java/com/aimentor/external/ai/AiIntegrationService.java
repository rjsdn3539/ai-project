package com.aimentor.external.ai;

import com.aimentor.external.ai.dto.AiAnalyzeAnswerFeedbackRequest;
import com.aimentor.external.ai.dto.AiAnalyzeAnswerFeedbackResponse;
import com.aimentor.external.ai.dto.AiGenerateInterviewQuestionsRequest;
import com.aimentor.external.ai.dto.AiGenerateInterviewQuestionsResponse;
import com.aimentor.external.ai.dto.AiGenerateReportSummaryRequest;
import com.aimentor.external.ai.dto.AiGenerateReportSummaryResponse;
import com.aimentor.external.ai.dto.AiParseJobPostingRequest;
import com.aimentor.external.ai.dto.AiParseJobPostingResponse;
import com.aimentor.external.ai.dto.AiInterviewChatRequest;
import com.aimentor.external.ai.dto.AiInterviewChatResponse;
import com.aimentor.external.ai.dto.AiResumeReviewRequest;
import com.aimentor.external.ai.dto.AiResumeReviewResponse;

public interface AiIntegrationService {

    AiGenerateInterviewQuestionsResponse generateInterviewQuestions(AiGenerateInterviewQuestionsRequest request);

    AiAnalyzeAnswerFeedbackResponse analyzeAnswerFeedback(AiAnalyzeAnswerFeedbackRequest request);

    AiGenerateReportSummaryResponse generateReportSummary(AiGenerateReportSummaryRequest request);

    AiParseJobPostingResponse parseJobPosting(AiParseJobPostingRequest request);

    AiResumeReviewResponse reviewDocument(AiResumeReviewRequest request);

    AiInterviewChatResponse chat(AiInterviewChatRequest request);
}
