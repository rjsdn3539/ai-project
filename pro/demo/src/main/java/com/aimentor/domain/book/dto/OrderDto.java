package com.aimentor.domain.book.dto;

import com.aimentor.domain.book.entity.Order;
import com.aimentor.domain.book.entity.OrderItem;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.List;

public class OrderDto {

    @Getter
    public static class CreateRequest {
        @NotBlank(message = "배송지를 입력해주세요.")
        private String address;
    }

    @Getter
    public static class Response {
        private final Long id;
        private final Integer totalPrice;
        private final String status;
        private final String address;
        private final LocalDateTime orderedAt;
        private final List<ItemResponse> orderItems;

        public Response(Order o) {
            this.id         = o.getId();
            this.totalPrice = o.getTotalPrice();
            this.status     = o.getStatus().name();
            this.address    = o.getAddress();
            this.orderedAt  = o.getOrderedAt();
            this.orderItems = o.getOrderItems().stream().map(ItemResponse::new).toList();
        }
    }

    @Getter
    public static class ItemResponse {
        private final Long bookId;
        private final String bookTitle;
        private final Integer quantity;
        private final Integer price;

        public ItemResponse(OrderItem oi) {
            this.bookId    = oi.getBook().getId();
            this.bookTitle = oi.getBook().getTitle();
            this.quantity  = oi.getQuantity();
            this.price     = oi.getPrice();
        }
    }
}
