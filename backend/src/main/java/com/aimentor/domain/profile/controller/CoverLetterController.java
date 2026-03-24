package com.aimentor.domain.profile.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.exception.ApiException;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.domain.profile.dto.request.CoverLetterUpsertRequest;
import com.aimentor.domain.profile.dto.response.CoverLetterResponse;
import com.aimentor.domain.profile.service.CoverLetterService;
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
@RequestMapping("/api/v1/profiles/cover-letters")
public class CoverLetterController {

    private final CoverLetterService coverLetterService;

    public CoverLetterController(CoverLetterService coverLetterService) {
        this.coverLetterService = coverLetterService;
    }

    @PostMapping
    public ApiResponse<CoverLetterResponse> create(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CoverLetterUpsertRequest request
    ) {
        return ApiResponse.success(coverLetterService.create(authenticatedUser.userId(), request));
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CoverLetterResponse> upload(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam String title,
            @RequestParam(required = false) String companyName,
            @RequestParam MultipartFile file
    ) {
        if (title == null || title.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "TITLE_REQUIRED", "자기소개서 제목은 필수입니다.");
        }
        return ApiResponse.success(
                coverLetterService.createFromFile(authenticatedUser.userId(), title.trim(), companyName, file)
        );
    }

    @GetMapping
    public ApiResponse<List<CoverLetterResponse>> list(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(required = false) String keyword
    ) {
        return ApiResponse.success(coverLetterService.list(authenticatedUser.userId(), keyword));
    }

    @GetMapping("/{coverLetterId}")
    public ApiResponse<CoverLetterResponse> get(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long coverLetterId
    ) {
        return ApiResponse.success(coverLetterService.get(authenticatedUser.userId(), coverLetterId));
    }

    @PutMapping("/{coverLetterId}")
    public ApiResponse<CoverLetterResponse> update(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long coverLetterId,
            @Valid @RequestBody CoverLetterUpsertRequest request
    ) {
        return ApiResponse.success(coverLetterService.update(authenticatedUser.userId(), coverLetterId, request));
    }

    @DeleteMapping("/{coverLetterId}")
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long coverLetterId
    ) {
        coverLetterService.delete(authenticatedUser.userId(), coverLetterId);
        return ApiResponse.success();
    }
}
