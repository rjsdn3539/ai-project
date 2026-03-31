package com.aimentor.domain.interview.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record StartInterviewSessionRequest(
        @NotBlank(message = "세션 제목은 필수입니다.")
        @Size(max = 100, message = "세션 제목은 100자 이하여야 합니다.")
        String title,

        @NotBlank(message = "직무명은 필수입니다.")
        @Size(max = 100, message = "직무명은 100자 이하여야 합니다.")
        String positionTitle,

        Long resumeId,

        Long coverLetterId,

        Long jobPostingId,

        @Positive(message = "질문 개수는 1 이상이어야 합니다.")
        Integer questionCount
) {
}
