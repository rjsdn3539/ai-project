package com.aimentor.external.ai.dto;

public record AiReportQaItem(
        String questionText,
        String answerText,
        int relevanceScore,
        int logicScore,
        int specificityScore,
        int overallScore,
        String feedbackSummary
) {
}
