package com.aimentor.domain.book.dto.response;

public record BookResponse(
        Long id,
        Long itemId,
        String isbn,
        String isbn13,
        String title,
        String author,
        String publisher,
        String description,
        String categoryName,
        Integer customerReviewRank,
        Integer priceStandard,
        Integer price,
        Integer priceSales,
        Integer stock,
        String saleStatus,
        String source,
        String coverUrl,
        java.time.LocalDateTime lastSyncedAt,
        java.time.LocalDateTime createdAt,
        java.time.LocalDateTime updatedAt
) {
}
