package com.aimentor.domain.profile.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ResumeUpsertRequest(
        @NotBlank(message = "이력서 제목은 필수입니다.")
        @Size(max = 100, message = "이력서 제목은 100자 이하여야 합니다.")
        String title,

        @NotBlank(message = "이력서 내용은 필수입니다.")
        @Size(max = 5000, message = "이력서 내용은 5000자 이하여야 합니다.")
        String content
) {
}
