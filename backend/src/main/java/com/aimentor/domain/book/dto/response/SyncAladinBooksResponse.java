package com.aimentor.domain.book.dto.response;

public record SyncAladinBooksResponse(
        int requestedCount,
        int savedCount,
        int createdCount,
        int updatedCount
) {
}
