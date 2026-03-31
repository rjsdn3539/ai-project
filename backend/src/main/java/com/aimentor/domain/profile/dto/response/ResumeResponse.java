package com.aimentor.domain.profile.dto.response;

import java.time.LocalDateTime;

public record ResumeResponse(
        Long id,
        String title,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
