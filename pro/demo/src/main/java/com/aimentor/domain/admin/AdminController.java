package com.aimentor.domain.admin;

import com.aimentor.common.dto.ApiResponse;
import com.aimentor.domain.book.repository.OrderRepository;
import com.aimentor.domain.interview.repository.InterviewSessionRepository;
import com.aimentor.domain.user.repository.UserRepository;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

/**
 * 관리자 대시보드 API (ADMIN 전용)
 * GET /api/admin/dashboard — 통계 요약
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepo;
    private final OrderRepository orderRepo;
    private final InterviewSessionRepository sessionRepo;

    @GetMapping("/dashboard")
    public ApiResponse<DashboardResponse> dashboard() {
        long totalUsers      = userRepo.count();
        long totalOrders     = orderRepo.countAll();
        long totalRevenue    = orderRepo.sumRevenue();
        long ongoingSessions = sessionRepo.countOngoing();

        return ApiResponse.success(
                new DashboardResponse(totalUsers, totalOrders, totalRevenue, ongoingSessions));
    }

    @Getter
    public static class DashboardResponse {
        private final long totalUsers;
        private final long totalOrders;
        private final long totalRevenue;
        private final long ongoingInterviews;

        public DashboardResponse(long totalUsers, long totalOrders,
                                 long totalRevenue, long ongoingInterviews) {
            this.totalUsers        = totalUsers;
            this.totalOrders       = totalOrders;
            this.totalRevenue      = totalRevenue;
            this.ongoingInterviews = ongoingInterviews;
        }
    }
}
