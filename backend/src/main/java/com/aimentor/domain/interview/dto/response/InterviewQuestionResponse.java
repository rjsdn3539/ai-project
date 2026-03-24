package com.aimentor.domain.interview.dto.response;

public record InterviewQuestionResponse(
        Long id,
        Integer sequenceNumber,
        String questionText,
        InterviewAnswerResponse answer
) {
}
