package com.aimentor.domain.profile.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.exception.ApiException;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.domain.profile.dto.request.ResumeUpsertRequest;
import com.aimentor.domain.profile.dto.response.ResumeResponse;
import com.aimentor.domain.profile.service.ResumeService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/v1/profiles/resumes")
public class ResumeController {

    private final ResumeService resumeService;

    public ResumeController(ResumeService resumeService) {
        this.resumeService = resumeService;
    }

    @PostMapping
    public ApiResponse<ResumeResponse> create(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody ResumeUpsertRequest request
    ) {
        return ApiResponse.success(resumeService.create(authenticatedUser.userId(), request));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ResumeResponse> upload(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam String title,
            @RequestParam MultipartFile file
    ) {
        if (title == null || title.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TITLE_REQUIRED", "이력서 제목은 필수입니다.");
        }
        return ApiResponse.success(resumeService.createFromFile(authenticatedUser.userId(), title.trim(), file));
    }

    @GetMapping
    public ApiResponse<List<ResumeResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(resumeService.list(authenticatedUser.userId(), keyword));
    }

    @GetMapping("/{resumeId}")
    public ApiResponse<ResumeResponse> get(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long resumeId
    ) {
        return ApiResponse.success(resumeService.get(authenticatedUser.userId(), resumeId));
    }

    @PutMapping("/{resumeId}")
    public ApiResponse<ResumeResponse> update(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long resumeId,
            @Valid @RequestBody ResumeUpsertRequest request
    ) {
        return ApiResponse.success(resumeService.update(authenticatedUser.userId(), resumeId, request));
    }

    @DeleteMapping("/{resumeId}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long resumeId
    ) {
        resumeService.delete(authenticatedUser.userId(), resumeId);
        return ApiResponse.success();
    }
}
