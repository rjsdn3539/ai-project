package com.aimentor.common.exception;

import org.springframework.http.HttpStatus;

/** Python AI 서버 연동 실패 시 발생하는 예외 */
public class AiServiceException extends BusinessException {
    public AiServiceException(String message) {
        super("AI_SERVICE_ERROR", message, HttpStatus.SERVICE_UNAVAILABLE);
    }
}
