package com.aimentor.domain.order.dto.response;

public record JusoAddressItemResponse(
        String roadAddr,
        String jibunAddr,
        String zipNo,
        String buildingName,
        String bdMgtSn
) {
}
