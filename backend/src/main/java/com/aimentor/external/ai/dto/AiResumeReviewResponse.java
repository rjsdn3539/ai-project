package com.aimentor.external.ai.dto;

import java.util.List;

public record AiResumeReviewResponse(
        String overall,
        List<String> strengths,
        List<String> improvements,
        List<String> revisedSuggestions
) {}
