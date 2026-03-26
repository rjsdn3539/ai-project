package com.aimentor.domain.learning.dto.response;

public record InterviewBookmarkResponse(
        String id,
        String questionText,
        String answerText,
        String sessionId,
        String date
) {
}
