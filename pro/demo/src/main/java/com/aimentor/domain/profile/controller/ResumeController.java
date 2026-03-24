package com.aimentor.domain.profile.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.profile.dto.ResumeDto;
import com.aimentor.domain.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 이력서 CRUD API
 * GET    /api/profile/resumes        — 목록 조회
 * GET    /api/profile/resumes/{id}   — 상세 조회
 * POST   /api/profile/resumes        — 등록 (multipart)
 * PUT    /api/profile/resumes/{id}   — 수정 (multipart)
 * DELETE /api/profile/resumes/{id}   — 삭제
 */
@RestController
@RequestMapping("/api/profile/resumes")
@RequiredArgsConstructor
public class ResumeController {

    private final ProfileService profileService;

    @GetMapping
    public ApiResponse<List<ResumeDto.Response>> list(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.getResumes(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<ResumeDto.Response> get(@PathVariable Long id,
                                               @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.getResume(id, userId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ResumeDto.Response> create(@Valid @RequestPart ResumeDto.Request request,
                                                  @RequestPart(required = false) MultipartFile file,
                                                  @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.createResume(request, file, userId));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ResumeDto.Response> update(@PathVariable Long id,
                                                  @Valid @RequestPart ResumeDto.Request request,
                                                  @RequestPart(required = false) MultipartFile file,
                                                  @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.updateResume(id, request, file, userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id,
                                    @AuthenticationPrincipal Long userId) {
        profileService.deleteResume(id, userId);
        return ApiResponse.success();
    }
}
