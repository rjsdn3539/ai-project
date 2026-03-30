package com.aimentor.domain.inquiry.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.domain.inquiry.dto.request.AnswerInquiryRequest;
import com.aimentor.domain.inquiry.dto.response.InquiryPageResponse;
import com.aimentor.domain.inquiry.dto.response.InquiryResponse;
import com.aimentor.domain.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/admin/inquiries")
@RequiredArgsConstructor
public class AdminInquiryController {

    private final InquiryService inquiryService;

    @GetMapping
    public ApiResponse<InquiryPageResponse> getInquiries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String search
    ) {
        return ApiResponse.success(inquiryService.getAllInquiries(page, size, status, search));
    }

    @PatchMapping("/{inquiryId}/answer")
    public ApiResponse<InquiryResponse> answerInquiry(
            @PathVariable Long inquiryId,
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody AnswerInquiryRequest request
    ) {
        return ApiResponse.success(inquiryService.answerInquiry(inquiryId, authenticatedUser.userId(), request));
    }
}
