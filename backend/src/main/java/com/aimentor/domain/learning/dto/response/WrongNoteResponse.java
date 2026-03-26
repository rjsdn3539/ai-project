package com.aimentor.domain.learning.dto.response;

import java.util.List;

public record WrongNoteResponse(
        Long id,
        String date,
        String subject,
        String difficulty,
        String question,
        String type,
        List<String> choices,
        String answer,
        String userAnswer,
        String aiFeedback,
        String explanation
) {
}