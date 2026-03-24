package com.aimentor.domain.profile.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.profile.dto.JobPostingDto;
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
 * 채용공고 CRUD API
 * GET    /api/profile/job-postings
 * GET    /api/profile/job-postings/{id}
 * POST   /api/profile/job-postings
 * PUT    /api/profile/job-postings/{id}
 * DELETE /api/profile/job-postings/{id}
 */
@RestController
@RequestMapping("/api/profile/job-postings")
@RequiredArgsConstructor
public class JobPostingController {

    private final ProfileService profileService;

    @GetMapping
    public ApiResponse<List<JobPostingDto.Response>> list(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.getJobPostings(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<JobPostingDto.Response> get(@PathVariable Long id,
                                                   @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.getJobPosting(id, userId));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<JobPostingDto.Response> create(@Valid @RequestPart JobPostingDto.Request request,
                                                      @RequestPart(required = false) MultipartFile file,
                                                      @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.createJobPosting(request, file, userId));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<JobPostingDto.Response> update(@PathVariable Long id,
                                                      @Valid @RequestPart JobPostingDto.Request request,
                                                      @RequestPart(required = false) MultipartFile file,
                                                      @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(profileService.updateJobPosting(id, request, file, userId));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@PathVariable Long id, @AuthenticationPrincipal Long userId) {
        profileService.deleteJobPosting(id, userId);
        return ApiResponse.success();
    }
}
