package com.aimentor.domain.order.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.domain.order.dto.response.JusoAddressSearchResponse;
import com.aimentor.external.address.JusoAddressService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping({"/api/v1/orders/addresses", "/api/orders/addresses"})
@RequiredArgsConstructor
public class AddressSearchController {

    private final JusoAddressService jusoAddressService;

    @GetMapping("/search")
    public ApiResponse<JusoAddressSearchResponse> searchAddresses(
            @RequestParam String keyword,
            @RequestParam(defaultValue = "1") int currentPage,
            @RequestParam(defaultValue = "10") int countPerPage
    ) {
        return ApiResponse.success(jusoAddressService.search(keyword.trim(), currentPage, countPerPage));
    }
}
