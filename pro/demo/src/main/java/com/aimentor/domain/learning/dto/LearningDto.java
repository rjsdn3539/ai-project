package com.aimentor.domain.learning.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.util.List;

public class LearningDto {

    @Getter
    public static class GenerateRequest {
        @NotBlank private String subject;
        @NotBlank private String difficulty; // EASY | MEDIUM | HARD
        @Min(1) @Max(10) private int count;
    }

    @Getter
    public static class AttemptRequest {
        private Long problemId;
        @NotBlank private String userAnswer;
    }

    @Getter
    public static class ProblemResponse {
        private final Long id;
        private final String type;
        private final String question;
        private final List<String> choices;
        // 정답/해설은 채점 전에 내려주지 않음

        public ProblemResponse(Long id, String type, String question, List<String> choices) {
            this.id       = id;
            this.type     = type;
            this.question = question;
            this.choices  = choices;
        }
    }

    @Getter
    public static class AttemptResponse {
        private final Boolean isCorrect;
        private final String correctAnswer;
        private final String aiFeedback;

        public AttemptResponse(Boolean isCorrect, String correctAnswer, String aiFeedback) {
            this.isCorrect     = isCorrect;
            this.correctAnswer = correctAnswer;
            this.aiFeedback    = aiFeedback;
        }
    }
}
