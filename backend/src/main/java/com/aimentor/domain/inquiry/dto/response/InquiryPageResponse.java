package com.aimentor.domain.inquiry.dto.response;

import java.util.List;
import org.springframework.data.domain.Page;

public record InquiryPageResponse(
        List<InquiryResponse> items,
        int page,
        int size,
        long totalElements,
        int totalPages
) {
    public static InquiryPageResponse of(Page<InquiryResponse> page) {
        return new InquiryPageResponse(
                page.getContent(),
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages()
        );
    }
}
