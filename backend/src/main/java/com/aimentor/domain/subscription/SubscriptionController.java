package com.aimentor.domain.subscription;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.security.AuthenticatedUser;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/subscription")
public class SubscriptionController {

    private final SubscriptionService subscriptionService;

    public SubscriptionController(SubscriptionService subscriptionService) {
        this.subscriptionService = subscriptionService;
    }

    @GetMapping("/my")
    public ResponseEntity<ApiResponse<SubscriptionStatusResponse>> getMyStatus(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        SubscriptionStatusResponse status = subscriptionService.getMyStatus(authenticatedUser.userId());
        return ResponseEntity.ok(ApiResponse.success(status));
    }

    record UpgradeRequest(String tier, String billing) {}

    @PostMapping("/upgrade")
    public ResponseEntity<ApiResponse<Void>> upgrade(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestBody UpgradeRequest request) {
        SubscriptionTier tier = SubscriptionTier.valueOf(request.tier().toUpperCase());
        int months = "yearly".equals(request.billing()) ? 12 : 1;
        subscriptionService.changeSubscription(authenticatedUser.userId(), tier, months);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    record DowngradeRequest(String tier) {}

    @PostMapping("/downgrade")
    public ResponseEntity<ApiResponse<Void>> downgrade(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestBody DowngradeRequest request) {
        SubscriptionTier tier = SubscriptionTier.valueOf(request.tier().toUpperCase());
        subscriptionService.scheduleDowngrade(authenticatedUser.userId(), tier);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @DeleteMapping("/downgrade")
    public ResponseEntity<ApiResponse<Void>> cancelDowngrade(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser) {
        subscriptionService.cancelDowngrade(authenticatedUser.userId());
        return ResponseEntity.ok(ApiResponse.success(null));
    }
}
