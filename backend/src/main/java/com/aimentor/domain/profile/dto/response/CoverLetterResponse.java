package com.aimentor.domain.profile.dto.response;

import java.time.LocalDateTime;

public record CoverLetterResponse(
        Long id,
        String title,
        String companyName,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
