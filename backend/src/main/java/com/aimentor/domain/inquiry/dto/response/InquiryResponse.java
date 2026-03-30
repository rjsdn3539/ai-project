package com.aimentor.domain.inquiry.dto.response;

import java.time.LocalDateTime;

public record InquiryResponse(
        Long id,
        String name,
        String email,
        String category,
        String subject,
        String message,
        String status,
        String adminAnswer,
        String answeredBy,
        LocalDateTime answeredAt,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
