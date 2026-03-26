package com.aimentor.domain.learning.dto.request;

import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record CreateWrongNoteRequest(
        String date,
        @NotBlank String subject,
        String difficulty,
        @NotBlank String question,
        String type,
        List<String> choices,
        String answer,
        String userAnswer,
        String aiFeedback,
        String explanation
) {
}