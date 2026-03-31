package com.aimentor.domain.interview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record SaveInterviewAnswerRequest(
        @NotNull(message = "질문 ID는 필수입니다.")
        Long questionId,

        @NotBlank(message = "답변 내용은 필수입니다.")
        @Size(max = 5000, message = "답변 내용은 5000자 이하여야 합니다.")
        String answerText,

        @Size(max = 500, message = "오디오 URL은 500자 이하여야 합니다.")
        String audioUrl
) {
}
