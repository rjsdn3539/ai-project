package com.aimentor.domain.inquiry.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.domain.inquiry.dto.request.CreateInquiryRequest;
import com.aimentor.domain.inquiry.dto.response.InquiryPageResponse;
import com.aimentor.domain.inquiry.dto.response.InquiryResponse;
import com.aimentor.domain.inquiry.service.InquiryService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/inquiries")
@RequiredArgsConstructor
public class InquiryController {

    private final InquiryService inquiryService;

    @PostMapping
    public ApiResponse<InquiryResponse> createInquiry(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateInquiryRequest request
    ) {
        return ApiResponse.success(inquiryService.createInquiry(authenticatedUser.userId(), request));
    }

    @GetMapping("/me")
    public ApiResponse<InquiryPageResponse> getMyInquiries(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "5") int size,
            @RequestParam(required = false) String status
    ) {
        return ApiResponse.success(inquiryService.getUserInquiries(authenticatedUser.userId(), page, size, status));
    }
}
