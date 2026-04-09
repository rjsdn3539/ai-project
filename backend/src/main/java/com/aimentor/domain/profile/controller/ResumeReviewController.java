package com.aimentor.domain.profile.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.external.ai.AiIntegrationService;
import com.aimentor.external.ai.dto.AiResumeReviewRequest;
import com.aimentor.external.ai.dto.AiResumeReviewResponse;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/resume")
public class ResumeReviewController {

    private final AiIntegrationService aiIntegrationService;

    public ResumeReviewController(AiIntegrationService aiIntegrationService) {
        this.aiIntegrationService = aiIntegrationService;
    }

    @PostMapping("/review")
    public ApiResponse<AiResumeReviewResponse> reviewDocument(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestBody ReviewRequest request
    ) {
        AiResumeReviewResponse result = aiIntegrationService.reviewDocument(
                new AiResumeReviewRequest(request.content(), request.documentType())
        );
        return ApiResponse.success(result);
    }

    public record ReviewRequest(String content, String documentType) {}
}
