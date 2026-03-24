package com.aimentor.domain.order.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.order.dto.CreateOrderRequest;
import com.aimentor.domain.order.entity.DeliveryStatus;
import com.aimentor.domain.order.entity.Order;
import com.aimentor.domain.order.entity.OrderItem;
import com.aimentor.domain.order.entity.OrderType;
import com.aimentor.domain.order.entity.PaymentStatus;
import com.aimentor.domain.order.repository.OrderRepository;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.concurrent.ThreadLocalRandom;

@Service
@RequiredArgsConstructor
public class OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;

    @Transactional
    public Order createOrder(Long userId, CreateOrderRequest req) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));

        OrderType orderType = OrderType.valueOf(req.orderType().toUpperCase());
        boolean isBook = orderType == OrderType.BOOK;

        Order order = Order.builder()
                .user(user)
                .orderNumber(generateOrderNumber())
                .orderType(orderType)
                .totalAmount(req.totalAmount())
                .paymentMethod(req.paymentMethod())
                .paymentStatus(PaymentStatus.PAID)
                .deliveryStatus(isBook ? DeliveryStatus.PENDING : null)
                .deliveryAddress(req.deliveryAddress())
                .recipientName(req.recipientName())
                .recipientPhone(req.recipientPhone())
                .build();

        orderRepository.save(order);

        if (isBook && req.items() != null) {
            for (CreateOrderRequest.OrderItemRequest item : req.items()) {
                OrderItem orderItem = OrderItem.builder()
                        .order(order)
                        .bookId(item.bookId())
                        .bookTitle(item.bookTitle())
                        .quantity(item.quantity())
                        .unitPrice(item.unitPrice())
                        .build();
                order.addItem(orderItem);
            }
        }

        return order;
    }

    private String generateOrderNumber() {
        String ts = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        int rand = ThreadLocalRandom.current().nextInt(1000, 9999);
        String candidate = ts + rand;
        while (orderRepository.existsByOrderNumber(candidate)) {
            rand = ThreadLocalRandom.current().nextInt(1000, 9999);
            candidate = ts + rand;
        }
        return candidate;
    }
}
