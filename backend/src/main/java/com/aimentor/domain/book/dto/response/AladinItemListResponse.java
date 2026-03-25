package com.aimentor.domain.book.dto.response;

import java.util.List;

public record AladinItemListResponse(
        int totalResults,
        List<AladinBookItemResponse> items
) {
}
