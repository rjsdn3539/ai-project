package com.aimentor.external.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Python AI 서버의 /interview/feedback 응답 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDto {
    private Integer logicScore;
    private Integer relevanceScore;
    private Integer specificityScore;
    private Integer overallScore;
    private String weakPoints;
    private String improvements;
    private String recommendedAnswer;
}
