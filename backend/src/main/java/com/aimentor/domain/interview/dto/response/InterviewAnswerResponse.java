package com.aimentor.domain.interview.dto.response;

import java.time.LocalDateTime;

public record InterviewAnswerResponse(
        Long id,
        String answerText,
        String audioUrl,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
