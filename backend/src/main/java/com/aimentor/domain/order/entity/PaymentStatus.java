package com.aimentor.domain.order.entity;

public enum PaymentStatus {
    PENDING,    // 결제 대기
    PAID,       // 결제 완료
    CANCELLED,  // 취소
    REFUNDED    // 환불
}
