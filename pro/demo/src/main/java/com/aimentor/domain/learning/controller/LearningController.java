package com.aimentor.domain.learning.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.learning.dto.LearningDto;
import com.aimentor.domain.learning.service.LearningService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 학습 API
 * POST /api/learning/generate  — 문제 생성
 * POST /api/learning/attempts  — 답변 제출 + 채점
 */
@RestController
@RequestMapping("/api/learning")
@RequiredArgsConstructor
public class LearningController {

    private final LearningService learningService;

    @PostMapping("/generate")
    public ApiResponse<List<LearningDto.ProblemResponse>> generate(
            @Valid @RequestBody LearningDto.GenerateRequest req) {
        return ApiResponse.success(learningService.generate(req));
    }

    @PostMapping("/attempts")
    public ApiResponse<LearningDto.AttemptResponse> attempt(
            @Valid @RequestBody LearningDto.AttemptRequest req,
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(learningService.attempt(req, userId));
    }
}
