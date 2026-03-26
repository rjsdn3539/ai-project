package com.aimentor.domain.learning.dto.request;

import jakarta.validation.constraints.NotBlank;

public record CreateInterviewBookmarkRequest(
        @NotBlank String id,
        @NotBlank String questionText,
        String answerText,
        String sessionId,
        String date
) {
}
