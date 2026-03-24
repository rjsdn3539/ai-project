package com.aimentor.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 비즈니스 로직 예외 기반 클래스
 */
@Getter
public class BusinessException extends RuntimeException {

    private final String errorCode;
    private final HttpStatus httpStatus;

    public BusinessException(String errorCode, String message, HttpStatus httpStatus) {
        super(message);
        this.errorCode = errorCode;
        this.httpStatus = httpStatus;
    }

    // ── 자주 쓰는 팩토리 메서드 ──────────────────────────────

    public static BusinessException notFound(String message) {
        return new BusinessException("NOT_FOUND", message, HttpStatus.NOT_FOUND);
    }

    public static BusinessException forbidden(String message) {
        return new BusinessException("FORBIDDEN", message, HttpStatus.FORBIDDEN);
    }

    public static BusinessException badRequest(String message) {
        return new BusinessException("BAD_REQUEST", message, HttpStatus.BAD_REQUEST);
    }

    public static BusinessException conflict(String message) {
        return new BusinessException("CONFLICT", message, HttpStatus.CONFLICT);
    }

    public static BusinessException outOfStock() {
        return new BusinessException("OUT_OF_STOCK", "재고가 부족합니다.", HttpStatus.BAD_REQUEST);
    }
}
