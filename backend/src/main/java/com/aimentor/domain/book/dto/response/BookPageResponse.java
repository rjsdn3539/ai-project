package com.aimentor.domain.book.dto.response;

import java.util.List;
import org.springframework.data.domain.Page;

public record BookPageResponse(
        List<BookResponse> content,
        int currentPage,
        int totalPages,
        long totalElements,
        int pageSize
) {
    public static BookPageResponse from(Page<BookResponse> page) {
        return new BookPageResponse(
                page.getContent(),
                page.getNumber(),
                page.getTotalPages(),
                page.getTotalElements(),
                page.getSize()
        );
    }
}
