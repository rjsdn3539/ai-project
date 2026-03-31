package com.aimentor.external.ai.dto;

public record AiGenerateReportSummaryResponse(
        String weakPoints,
        String improvements,
        String recommendedAnswer,
        String providerName,
        boolean stubbed
) {
}
