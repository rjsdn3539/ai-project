package com.aimentor.domain.book.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.book.dto.BookDto;
import com.aimentor.domain.book.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/**
 * 도서 API
 * GET    /api/books          — 목록 (검색, 페이징) — 인증 불필요
 * GET    /api/books/{id}     — 상세 — 인증 불필요
 * POST   /api/books          — 등록 (ADMIN)
 * PUT    /api/books/{id}     — 수정 (ADMIN)
 * DELETE /api/books/{id}     — 삭제 (ADMIN)
 */
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
public class BookController {

    private final BookService bookService;

    @GetMapping
    public ApiResponse<Page<BookDto.Response>> list(
            @RequestParam(required = false) String keyword,
            @PageableDefault(size = 12) Pageable pageable) {
        return ApiResponse.success(bookService.getBooks(keyword, pageable));
    }

    @GetMapping("/{id}")
    public ApiResponse<BookDto.Response> get(@PathVariable Long id) {
        return ApiResponse.success(bookService.getBook(id));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookDto.Response> create(@Valid @RequestBody BookDto.Request req) {
        return ApiResponse.success(bookService.createBook(req));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<BookDto.Response> update(@PathVariable Long id,
                                                @Valid @RequestBody BookDto.Request req) {
        return ApiResponse.success(bookService.updateBook(id, req));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ApiResponse<Void> delete(@PathVariable Long id) {
        bookService.deleteBook(id);
        return ApiResponse.success();
    }
}
