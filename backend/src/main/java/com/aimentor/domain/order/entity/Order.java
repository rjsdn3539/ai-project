package com.aimentor.domain.order.entity;

import com.aimentor.common.entity.BaseTimeEntity;
import com.aimentor.domain.user.entity.User;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Order extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, unique = true, length = 32)
    private String orderNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderType orderType;

    @Column(nullable = false)
    private Integer totalAmount;

    @Column(length = 50)
    private String paymentMethod;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private PaymentStatus paymentStatus;

    @Enumerated(EnumType.STRING)
    @Column(length = 20)
    private DeliveryStatus deliveryStatus;

    @Column(length = 100)
    private String trackingNumber;

    @Column(length = 255)
    private String deliveryAddress;

    @Column(length = 50)
    private String recipientName;

    @Column(length = 20)
    private String recipientPhone;

    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<OrderItem> items = new ArrayList<>();

    @Builder
    public Order(User user, String orderNumber, OrderType orderType, Integer totalAmount,
                 String paymentMethod, PaymentStatus paymentStatus, DeliveryStatus deliveryStatus,
                 String deliveryAddress, String recipientName, String recipientPhone) {
        this.user = user;
        this.orderNumber = orderNumber;
        this.orderType = orderType;
        this.totalAmount = totalAmount;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.deliveryStatus = deliveryStatus;
        this.deliveryAddress = deliveryAddress;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
    }

    public void updatePaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public void updateDelivery(DeliveryStatus deliveryStatus, String trackingNumber) {
        this.deliveryStatus = deliveryStatus;
        if (trackingNumber != null) {
            this.trackingNumber = trackingNumber;
        }
    }

    public void addItem(OrderItem item) {
        items.add(item);
    }
}
