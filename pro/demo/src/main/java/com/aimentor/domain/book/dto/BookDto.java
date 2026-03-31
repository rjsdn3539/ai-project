package com.aimentor.domain.book.dto;

import com.aimentor.domain.book.entity.Book;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.time.LocalDateTime;

public class BookDto {

    @Getter
    public static class Request {
        @NotBlank(message = "제목을 입력해주세요.") private String title;
        @NotBlank(message = "저자를 입력해주세요.") private String author;
        private String publisher;
        @NotNull @Min(0) private Integer price;
        @NotNull @Min(0) private Integer stock;
        private String coverUrl;
        private String description;
    }

    @Getter
    public static class Response {
        private final Long id;
        private final String title;
        private final String author;
        private final String publisher;
        private final Integer price;
        private final Integer stock;
        private final String coverUrl;
        private final String description;
        private final LocalDateTime createdAt;

        public Response(Book b) {
            this.id          = b.getId();
            this.title       = b.getTitle();
            this.author      = b.getAuthor();
            this.publisher   = b.getPublisher();
            this.price       = b.getPrice();
            this.stock       = b.getStock();
            this.coverUrl    = b.getCoverUrl();
            this.description = b.getDescription();
            this.createdAt   = b.getCreatedAt();
        }
    }
}
