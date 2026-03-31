package com.aimentor.domain.book.controller;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.book.dto.OrderDto;
import com.aimentor.domain.book.service.BookService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 주문 API
 * POST /api/orders      — 주문 생성 (장바구니 전체)
 * GET  /api/orders      — 내 주문 목록
 * GET  /api/orders/{id} — 주문 상세
 */
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final BookService bookService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<OrderDto.Response> create(@Valid @RequestBody OrderDto.CreateRequest req,
                                                 @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(bookService.createOrder(req, userId));
    }

    @GetMapping
    public ApiResponse<List<OrderDto.Response>> list(@AuthenticationPrincipal Long userId) {
        return ApiResponse.success(bookService.getOrders(userId));
    }

    @GetMapping("/{id}")
    public ApiResponse<OrderDto.Response> get(@PathVariable Long id,
                                              @AuthenticationPrincipal Long userId) {
        return ApiResponse.success(bookService.getOrder(id, userId));
    }
}
