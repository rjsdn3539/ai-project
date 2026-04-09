package com.aimentor.external.ai.dto;

import java.util.List;

public record AiInterviewChatRequest(
        List<ChatMessage> messages,
        String weakPoints,
        String improvements,
        String recommendedAnswer,
        String positionTitle
) {
    public record ChatMessage(String role, String content) {}
}
