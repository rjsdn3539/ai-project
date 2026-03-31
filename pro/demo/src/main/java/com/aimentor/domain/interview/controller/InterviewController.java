package com.aimentor.domain.interview.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.interview.dto.InterviewDto;
import com.aimentor.domain.interview.service.InterviewService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 면접 세션 API
 * POST /api/interviews/sessions             — 세션 시작
 * GET  /api/interviews/sessions             — 내 세션 목록
 * GET  /api/interviews/sessions/{id}        — 세션 상세 + Q&A
 * POST /api/interviews/sessions/{id}/answer — 답변 제출 (audio 파일)
 * POST /api/interviews/sessions/{id}/end    — 면접 종료
 * GET  /api/interviews/sessions/{id}/feedback — 피드백 조회
 */
@RestController
@RequestMapping("/api/interviews/sessions")
@RequiredArgsConstructor
public class InterviewController {

    private final InterviewService interviewService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<InterviewDto.SessionResponse> start(
            @RequestBody InterviewDto.StartRequest req,
            @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(interviewService.startSession(req, userId));
    }

    @GetMapping
    public ApiResponse<List<InterviewDto.SessionResponse>> list(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(interviewService.getSessions(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<InterviewDto.SessionDetailResponse> detail(@PathVariable Long id,
                                                                   @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(interviewService.getSession(id, userId));
    }

    @PostMapping(value = "/{id}/answer", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<InterviewDto.SessionResponse> answer(@PathVariable Long id,
                                                            @RequestPart MultipartFile audio,
                                                            @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(interviewService.submitAnswer(id, audio, userId));
    }

    @PostMapping("/{id}/answer/text")
    public ApiResponse<InterviewDto.SessionResponse> answerText(@PathVariable Long id,
                                                                @RequestBody InterviewDto.TextAnswerRequest req,
                                                                @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(interviewService.submitTextAnswer(id, req.getAnswerText(), userId));
    }

    @PostMapping("/{id}/end")
    public ApiResponse<InterviewDto.FeedbackResponse> end(@PathVariable Long id,
                                                          @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(interviewService.endSession(id, userId));
    }

    @GetMapping("/{id}/feedback")
    public ApiResponse<InterviewDto.FeedbackResponse> feedback(@PathVariable Long id,
                                                               @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(interviewService.getFeedback(id, userId));
    }
}
