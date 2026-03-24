package com.aimentor.external.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.List;

/** 학습 문제 하나 */
@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ProblemDto {
    private String type;         // "MULTIPLE" | "SHORT"
    private String question;
    private List<String> choices; // 객관식만 사용
    private String answer;
    private String explanation;
}
