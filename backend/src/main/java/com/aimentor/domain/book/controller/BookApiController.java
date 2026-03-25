package com.aimentor.domain.book.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.domain.book.dto.response.BookPageResponse;
import com.aimentor.domain.book.dto.response.BookResponse;
import com.aimentor.domain.book.service.BookService;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/books")
public class BookApiController {

    private final BookService bookService;

    public BookApiController(BookService bookService) {
        this.bookService = bookService;
    }

    @GetMapping
    public ApiResponse<BookPageResponse> getBooks(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ApiResponse.success(BookPageResponse.from(bookService.getBooks("", page, size)));
    }

    @GetMapping("/search")
    public ApiResponse<BookPageResponse> searchBooks(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size
    ) {
        return ApiResponse.success(BookPageResponse.from(bookService.getBooks(keyword, page, size)));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookResponse> getBook(@PathVariable Long id) {
        return ApiResponse.success(bookService.getBook(id));
    }
}
