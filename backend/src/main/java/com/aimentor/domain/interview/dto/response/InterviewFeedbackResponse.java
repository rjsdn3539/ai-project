package com.aimentor.domain.interview.dto.response;

public record InterviewFeedbackResponse(
        Integer relevanceScore,
        Integer logicScore,
        Integer specificityScore,
        Integer overallScore,
        String summary,
        String weakPoints,
        String improvements,
        String recommendedAnswer
) {
}
