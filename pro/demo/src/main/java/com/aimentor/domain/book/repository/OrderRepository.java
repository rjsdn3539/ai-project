package com.aimentor.domain.book.repository;

import com.aimentor.domain.book.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface OrderRepository extends JpaRepository<Order, Long> {
    List<Order> findByUserIdOrderByOrderedAtDesc(Long userId);
    Optional<Order> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COUNT(o) FROM Order o")
    long countAll();

    @Query("SELECT COALESCE(SUM(o.totalPrice), 0) FROM Order o WHERE o.status = 'PAID'")
    long sumRevenue();
}
