package com.aimentor.domain.order.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.domain.order.dto.CreateOrderRequest;
import com.aimentor.domain.order.entity.Order;
import com.aimentor.domain.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping
    public ApiResponse<OrderResponse> createOrder(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestBody CreateOrderRequest request) {
        Order order = orderService.createOrder(authenticatedUser.userId(), request);
        return ApiResponse.success(new OrderResponse(order.getId(), order.getOrderNumber(), order.getCreatedAt()));
    }

    public record OrderResponse(Long id, String orderNumber, LocalDateTime createdAt) {}
}
