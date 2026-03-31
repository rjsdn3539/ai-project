package com.aimentor.domain.profile.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record JobPostingUpsertRequest(
        @NotBlank(message = "회사명은 필수입니다.")
        @Size(max = 100, message = "회사명은 100자 이하여야 합니다.")
        String companyName,

        @NotBlank(message = "직무명은 필수입니다.")
        @Size(max = 100, message = "직무명은 100자 이하여야 합니다.")
        String positionTitle,

        @NotBlank(message = "채용공고 내용은 필수입니다.")
        @Size(max = 5000, message = "채용공고 내용은 5000자 이하여야 합니다.")
        String description,

        @Size(max = 300, message = "채용공고 URL은 300자 이하여야 합니다.")
        String jobUrl,

        LocalDate deadline
) {
}
