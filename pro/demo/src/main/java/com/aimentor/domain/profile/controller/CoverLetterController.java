package com.aimentor.domain.profile.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.profile.dto.CoverLetterDto;
import com.aimentor.domain.profile.service.ProfileService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 자기소개서 CRUD API
 * GET    /api/profile/cover-letters
 * GET    /api/profile/cover-letters/{id}
 * POST   /api/profile/cover-letters
 * PUT    /api/profile/cover-letters/{id}
 * DELETE /api/profile/cover-letters/{id}
 */
@RestController
@RequestMapping("/api/profile/cover-letters")
@RequiredArgsConstructor
public class CoverLetterController {

    private final ProfileService profileService;

    @GetMapping
    public ApiResponse<List<CoverLetterDto.Response>> list(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.getCoverLetters(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<CoverLetterDto.Response> get(@PathVariable Long id,
                                                    @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.getCoverLetter(id, userId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CoverLetterDto.Response> create(@Valid @RequestBody CoverLetterDto.Request req,
                                                       @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.createCoverLetter(req, userId));
    }

    @PutMapping("/{id}")
    public ApiResponse<CoverLetterDto.Response> update(@PathVariable Long id,
                                                       @Valid @RequestBody CoverLetterDto.Request req,
                                                       @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.updateCoverLetter(id, req, userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        profileService.deleteCoverLetter(id, userId);
        return ApiResponse.success();
    }
}
