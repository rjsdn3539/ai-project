package com.aimentor.domain.book.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.domain.book.dto.response.AladinItemListResponse;
import com.aimentor.domain.book.dto.response.BookResponse;
import com.aimentor.domain.book.service.BookService;
import com.aimentor.domain.book.service.ItBookService;
import com.aimentor.external.aladin.AladinBookService;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.Page;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/books")
public class BookController {

    private final BookService bookService;
    private final ItBookService itBookService;
    private final AladinBookService aladinBookService;

    public BookController(BookService bookService, ItBookService itBookService, AladinBookService aladinBookService) {
        this.bookService = bookService;
        this.itBookService = itBookService;
        this.aladinBookService = aladinBookService;
    }

    @GetMapping("/it")
    public ApiResponse<AladinItemListResponse> getItBooks() {
        return ApiResponse.success(itBookService.getItBooks());
    }

    @GetMapping("/aladin")
    public ApiResponse<AladinItemListResponse> getAladinBooks(
            @RequestParam(defaultValue = "개발") String query,
            @RequestParam(defaultValue = "Book") String searchTarget,
            @RequestParam(defaultValue = "27660") String categoryId,
            @RequestParam(defaultValue = "12") @Min(1) @Max(50) int maxResults,
            @RequestParam(defaultValue = "1") @Min(1) int start
    ) {
        return ApiResponse.success(aladinBookService.searchBooks(query, searchTarget, categoryId, maxResults, start));
    }

    @GetMapping
    public ApiResponse<Page<BookResponse>> getBooks(
            @RequestParam(defaultValue = "") String keyword,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "12") int size
    ) {
        return ApiResponse.success(bookService.getBooks(keyword, page, size));
    }

    @GetMapping("/{bookId}")
    public ApiResponse<BookResponse> getBook(@PathVariable Long bookId) {
        return ApiResponse.success(bookService.getBook(bookId));
    }
}
