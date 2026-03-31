package com.aimentor.domain.book.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SyncAladinBooksRequest(
        @NotBlank String query,
        String searchTarget,
        String categoryId,
        @Min(1) @Max(50) Integer maxResults,
        @Min(1) Integer start,
        @Min(0) Integer stock,
        String saleStatus
) {
}
