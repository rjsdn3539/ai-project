package com.aimentor.domain.order.dto.response;

import java.util.List;

public record JusoAddressSearchResponse(
        List<JusoAddressItemResponse> results,
        int totalCount,
        int currentPage,
        int countPerPage
) {
}
