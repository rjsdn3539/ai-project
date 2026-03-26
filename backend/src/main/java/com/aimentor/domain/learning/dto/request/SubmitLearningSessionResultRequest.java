package com.aimentor.domain.learning.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record SubmitLearningSessionResultRequest(
        @NotBlank String subject,
        @NotNull @Min(0) Integer answeredCount,
        @NotNull @Min(0) Integer correctCount,
        @Valid List<CreateWrongNoteRequest> wrongNotes
) {
}