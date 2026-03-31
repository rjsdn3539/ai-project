package com.aimentor.domain.order.repository;

import com.aimentor.domain.order.entity.DeliveryStatus;
import com.aimentor.domain.order.entity.Order;
import com.aimentor.domain.order.entity.OrderType;
import com.aimentor.domain.order.entity.PaymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {

    Page<Order> findByPaymentStatus(PaymentStatus paymentStatus, Pageable pageable);

    Page<Order> findByOrderType(OrderType orderType, Pageable pageable);

    Page<Order> findByOrderTypeAndDeliveryStatus(OrderType orderType, DeliveryStatus deliveryStatus, Pageable pageable);

    List<Order> findByUser_IdAndOrderTypeOrderByCreatedAtDesc(Long userId, OrderType orderType);

    Optional<Order> findByIdAndUser_IdAndOrderType(Long id, Long userId, OrderType orderType);

    boolean existsByOrderNumber(String orderNumber);
}
