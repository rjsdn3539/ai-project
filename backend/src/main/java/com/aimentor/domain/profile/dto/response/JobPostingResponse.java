package com.aimentor.domain.profile.dto.response;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record JobPostingResponse(
        Long id,
        String companyName,
        String positionTitle,
        String description,
        String jobUrl,
        LocalDate deadline,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
