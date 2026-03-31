package com.aimentor.domain.learning.dto.response;

import java.util.List;
import java.util.Map;

public record AchievementStateResponse(
        Map<String, Object> stats,
        List<InterviewBookmarkResponse> bookmarks
) {
}