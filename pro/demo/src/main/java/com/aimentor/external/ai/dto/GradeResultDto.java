package com.aimentor.external.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** 채점 결과 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class GradeResultDto {
    private Boolean isCorrect;
    private String aiFeedback;
}
