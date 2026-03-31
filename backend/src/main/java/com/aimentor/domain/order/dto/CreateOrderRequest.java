package com.aimentor.domain.order.dto;

import java.util.List;

public record CreateOrderRequest(
        String orderType,          // BOOK | SUBSCRIPTION
        Integer totalAmount,
        String paymentMethod,
        String paymentId,          // 포트원 결제 ID
        String orderName,
        // 도서 주문 필드
        List<OrderItemRequest> items,
        String deliveryAddress,
        String recipientName,
        String recipientPhone
) {
    public record OrderItemRequest(
            Long bookId,
            String bookTitle,
            Integer quantity,
            Integer unitPrice
    ) {}
}
