package com.aimentor.domain.learning.dto.response;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public record LearningProgressResponse(
        Long id,
        String subject,
        String difficulty,
        Integer count,
        Integer currentIdx,
        List<Map<String, Object>> problems,
        Map<String, Object> userAnswers,
        Map<String, Object> results,
        LocalDateTime savedAt
) {
}