package com.aimentor.domain.book.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.book.dto.CartDto;
import com.aimentor.domain.book.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 장바구니 API
 * GET    /api/cart               — 조회
 * POST   /api/cart               — 추가
 * PUT    /api/cart/{bookId}      — 수량 변경
 * DELETE /api/cart/{bookId}      — 항목 삭제
 */
@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final BookService bookService;

    @GetMapping
    public ApiResponse<List<CartDto.Response>> get(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(bookService.getCart(userId));
    }

    @PostMapping
    public ApiResponse<CartDto.Response> add(@Valid @RequestBody CartDto.AddRequest req,
                                             @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(bookService.addToCart(req, userId));
    }

    @PutMapping("/{bookId}")
    public ApiResponse<CartDto.Response> update(@PathVariable Long bookId,
                                                @Valid @RequestBody CartDto.UpdateRequest req,
                                                @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(bookService.updateCartItem(bookId, req, userId));
    }

    @DeleteMapping("/{bookId}")
    public ApiResponse<Void> delete(@PathVariable Long bookId,
                                    @AuthenticationPrincipal Long userId) {
        bookService.removeFromCart(bookId, userId);
        return ApiResponse.success();
    }
}
