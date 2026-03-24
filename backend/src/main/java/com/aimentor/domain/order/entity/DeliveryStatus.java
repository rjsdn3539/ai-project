package com.aimentor.domain.order.entity;

public enum DeliveryStatus {
    PENDING,    // 배송 준비 중
    PREPARING,  // 상품 준비 중
    SHIPPING,   // 배송 중
    DELIVERED   // 배송 완료
}
