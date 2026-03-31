package com.aimentor.domain.book.dto.response;

public record AladinBookItemResponse(
        Long itemId,
        String isbn,
        String isbn13,
        String title,
        String author,
        String publisher,
        String pubDate,
        Integer customerReviewRank,
        Integer priceSales,
        Integer priceStandard,
        String cover,
        String categoryName,
        String description,
        String link
) {
}
