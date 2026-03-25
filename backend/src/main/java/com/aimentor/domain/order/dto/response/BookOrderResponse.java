package com.aimentor.domain.order.dto.response;

import java.time.LocalDateTime;
import java.util.List;

public record BookOrderResponse(
        Long id,
        LocalDateTime orderedAt,
        String status,
        Integer totalPrice,
        String address,
        List<BookOrderItemResponse> items
) {
    public record BookOrderItemResponse(
            Long bookId,
            String bookTitle,
            Integer quantity,
            Integer price
    ) {
    }
}
