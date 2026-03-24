package com.aimentor.domain.admin;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.domain.admin.AdminService.BookRequest;
import com.aimentor.domain.admin.AdminService.BookSummary;
import com.aimentor.domain.admin.AdminService.ChangeRoleRequest;
import com.aimentor.domain.admin.AdminService.ChangeSubscriptionRequest;
import com.aimentor.domain.admin.AdminService.DashboardData;
import com.aimentor.domain.admin.AdminService.OrderSummary;
import com.aimentor.domain.admin.AdminService.SessionSummary;
import com.aimentor.domain.admin.AdminService.UpdateDeliveryRequest;
import com.aimentor.domain.admin.AdminService.UpdatePaymentStatusRequest;
import com.aimentor.domain.admin.AdminService.UserSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * 관리자 전용 API — SecurityConfig 에서 ADMIN 역할만 접근 허용
 * GET  /api/v1/admin/dashboard
 * GET  /api/v1/admin/users
 * PATCH /api/v1/admin/users/{id}/role
 * DELETE /api/v1/admin/users/{id}
 * GET  /api/v1/admin/sessions
 * DELETE /api/v1/admin/sessions/{id}
 * GET  /api/v1/admin/books
 * POST /api/v1/admin/books
 * PUT  /api/v1/admin/books/{id}
 * DELETE /api/v1/admin/books/{id}
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @GetMapping("/dashboard")
    public ApiResponse<DashboardData> dashboard() {
        return ApiResponse.success(adminService.getDashboard());
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    @GetMapping("/users")
    public ApiResponse<PageResult<UserSummary>> users(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        Page<UserSummary> result = adminService.getUsers(page, size, search);
        return ApiResponse.success(PageResult.of(result));
    }

    @PatchMapping("/users/{id}/role")
    public ApiResponse<UserSummary> changeRole(@PathVariable Long id,
                                               @RequestBody ChangeRoleRequest req) {
        return ApiResponse.success(adminService.changeUserRole(id, req.role()));
    }

    @PatchMapping("/users/{id}/subscription")
    public ApiResponse<UserSummary> changeSubscription(@PathVariable Long id,
                                                       @RequestBody ChangeSubscriptionRequest req) {
        return ApiResponse.success(adminService.changeUserSubscription(id, req.tier(), req.durationMonths()));
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    // ── Sessions ───────────────────────────────────────────────────────────────

    @GetMapping("/sessions")
    public ApiResponse<PageResult<SessionSummary>> sessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String status) {
        Page<SessionSummary> result = adminService.getSessions(page, size, status);
        return ApiResponse.success(PageResult.of(result));
    }

    @DeleteMapping("/sessions/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteSession(@PathVariable Long id) {
        adminService.deleteSession(id);
        return ResponseEntity.noContent().build();
    }

    // ── Books ──────────────────────────────────────────────────────────────────

    @GetMapping("/books")
    public ApiResponse<PageResult<BookSummary>> books(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String search) {
        Page<BookSummary> result = adminService.getBooks(page, size, search);
        return ApiResponse.success(PageResult.of(result));
    }

    @PostMapping("/books")
    public ApiResponse<BookSummary> createBook(@RequestBody BookRequest req) {
        return ApiResponse.success(adminService.createBook(req));
    }

    @PutMapping("/books/{id}")
    public ApiResponse<BookSummary> updateBook(@PathVariable Long id,
                                               @RequestBody BookRequest req) {
        return ApiResponse.success(adminService.updateBook(id, req));
    }

    @DeleteMapping("/books/{id}")
    public ResponseEntity<ApiResponse<Void>> deleteBook(@PathVariable Long id) {
        adminService.deleteBook(id);
        return ResponseEntity.noContent().build();
    }

    // ── Orders (결제 관리) ─────────────────────────────────────────────────────

    @GetMapping("/orders")
    public ApiResponse<PageResult<OrderSummary>> orders(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String paymentStatus) {
        return ApiResponse.success(PageResult.of(adminService.getOrders(page, size, paymentStatus)));
    }

    @PatchMapping("/orders/{id}/payment")
    public ApiResponse<OrderSummary> updatePaymentStatus(@PathVariable Long id,
                                                         @RequestBody UpdatePaymentStatusRequest req) {
        return ApiResponse.success(adminService.updatePaymentStatus(id, req.paymentStatus()));
    }

    // ── Deliveries (배송 관리) ─────────────────────────────────────────────────

    @GetMapping("/deliveries")
    public ApiResponse<PageResult<OrderSummary>> deliveries(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(required = false) String deliveryStatus) {
        return ApiResponse.success(PageResult.of(adminService.getDeliveries(page, size, deliveryStatus)));
    }

    @PatchMapping("/orders/{id}/delivery")
    public ApiResponse<OrderSummary> updateDelivery(@PathVariable Long id,
                                                    @RequestBody UpdateDeliveryRequest req) {
        return ApiResponse.success(adminService.updateDelivery(id, req.deliveryStatus(), req.trackingNumber()));
    }

    // ── Util ───────────────────────────────────────────────────────────────────

    public record PageResult<T>(
            java.util.List<T> items,
            int page,
            int size,
            long totalElements,
            int totalPages) {

        static <T> PageResult<T> of(Page<T> p) {
            return new PageResult<>(p.getContent(), p.getNumber(), p.getSize(),
                    p.getTotalElements(), p.getTotalPages());
        }
    }
}
