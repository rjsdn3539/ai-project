package com.aimentor.domain.book.dto;

import com.aimentor.domain.book.entity.CartItem;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

public class CartDto {

    @Getter
    public static class AddRequest {
        @NotNull private Long bookId;
        @NotNull @Min(1) private Integer quantity;
    }

    @Getter
    public static class UpdateRequest {
        @NotNull @Min(1) private Integer quantity;
    }

    @Getter
    public static class Response {
        private final Long id;
        private final Long bookId;
        private final String bookTitle;
        private final Integer price;
        private final Integer quantity;
        private final Integer subtotal;

        public Response(CartItem item) {
            this.id        = item.getId();
            this.bookId    = item.getBook().getId();
            this.bookTitle = item.getBook().getTitle();
            this.price     = item.getBook().getPrice();
            this.quantity  = item.getQuantity();
            this.subtotal  = item.getBook().getPrice() * item.getQuantity();
        }
    }
}
