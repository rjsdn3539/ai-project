package com.aimentor.domain.interview.dto.response;

import com.aimentor.domain.interview.entity.InterviewSessionStatus;
import java.time.LocalDateTime;
import java.util.List;

public record InterviewResultReportResponse(
        Long sessionId,
        String title,
        String positionTitle,
        InterviewSessionStatus status,
        LocalDateTime startedAt,
        LocalDateTime endedAt,
        List<InterviewQuestionResponse> questions,
        InterviewFeedbackResponse feedback
) {
}
