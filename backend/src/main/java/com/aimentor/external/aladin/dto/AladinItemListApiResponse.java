package com.aimentor.external.aladin.dto;

import java.util.List;

public record AladinItemListApiResponse(
        Integer totalResults,
        List<AladinItemApiResponse> item
) {
    public record AladinItemApiResponse(
            Long itemId,
            String title,
            String author,
            String publisher,
            String pubDate,
            String isbn,
            String isbn13,
            Integer customerReviewRank,
            Integer priceSales,
            Integer priceStandard,
            String cover,
            String categoryName,
            String description,
            String link
    ) {
    }
}
