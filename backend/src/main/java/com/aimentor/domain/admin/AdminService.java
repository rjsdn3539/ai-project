package com.aimentor.domain.admin;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.book.entity.Book;
import com.aimentor.domain.book.repository.BookRepository;
import com.aimentor.domain.interview.entity.InterviewSession;
import com.aimentor.domain.interview.entity.InterviewSessionStatus;
import com.aimentor.domain.interview.repository.InterviewSessionRepository;
import com.aimentor.domain.order.entity.DeliveryStatus;
import com.aimentor.domain.order.entity.Order;
import com.aimentor.domain.order.entity.OrderType;
import com.aimentor.domain.order.entity.PaymentStatus;
import com.aimentor.domain.order.repository.OrderRepository;
import com.aimentor.domain.subscription.SubscriptionService;
import com.aimentor.domain.subscription.SubscriptionTier;
import com.aimentor.domain.user.entity.Role;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final InterviewSessionRepository sessionRepository;
    private final BookRepository bookRepository;
    private final SubscriptionService subscriptionService;
    private final OrderRepository orderRepository;

    // ── Dashboard ──────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public DashboardData getDashboard() {
        long totalUsers = userRepository.count();
        LocalDateTime todayStart = LocalDate.now().atStartOfDay();
        long newUsersToday = userRepository.countByCreatedAtBetween(todayStart, LocalDateTime.now());
        long totalSessions = sessionRepository.count();
        long activeSessions = sessionRepository.countByStatus(InterviewSessionStatus.IN_PROGRESS);
        long totalBooks = bookRepository.count();

        List<Object[]> rawSignups = userRepository.countDailySignups(
                LocalDate.now().minusDays(6).atStartOfDay());
        List<Map<String, Object>> dailySignups = rawSignups.stream()
                .map(row -> Map.<String, Object>of("date", row[0].toString(), "count", ((Number) row[1]).longValue()))
                .collect(Collectors.toList());

        return new DashboardData(totalUsers, newUsersToday, totalSessions, activeSessions, totalBooks, dailySignups);
    }

    // ── Users ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<UserSummary> getUsers(int page, int size, String search) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<User> users = (search != null && !search.isBlank())
                ? userRepository.findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(search, search, pageable)
                : userRepository.findAll(pageable);
        return users.map(u -> new UserSummary(u.getId(), u.getName(), u.getEmail(),
                u.getRole().name(), u.getEffectiveTier().name(), u.getCreatedAt()));
    }

    @Transactional
    public UserSummary changeUserRole(Long userId, String role) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        user.changeRole(Role.valueOf(role));
        return new UserSummary(user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), user.getEffectiveTier().name(), user.getCreatedAt());
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found");
        }
        userRepository.deleteById(userId);
    }

    // ── Sessions ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<SessionSummary> getSessions(int page, int size, String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("startedAt").descending());
        Page<InterviewSession> sessions = (status != null && !status.isBlank())
                ? sessionRepository.findByStatus(InterviewSessionStatus.valueOf(status.toUpperCase()), pageable)
                : sessionRepository.findAll(pageable);
        return sessions.map(s -> new SessionSummary(
                s.getId(), s.getUser().getName(), s.getUser().getEmail(),
                s.getPositionTitle(), s.getStatus().name(), s.getStartedAt(), s.getEndedAt()));
    }

    @Transactional
    public void deleteSession(Long sessionId) {
        if (!sessionRepository.existsById(sessionId)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "SESSION_NOT_FOUND", "Session not found");
        }
        sessionRepository.deleteById(sessionId);
    }

    // ── Books ──────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<BookSummary> getBooks(int page, int size, String search) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Book> books = (search != null && !search.isBlank())
                ? bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(search, search, pageable)
                : bookRepository.findAll(pageable);
        return books.map(b -> new BookSummary(b.getId(), b.getTitle(), b.getAuthor(), b.getPublisher(),
                b.getPrice(), b.getStock(), b.getCoverUrl(), b.getDescription(), b.getCreatedAt()));
    }

    @Transactional
    public BookSummary createBook(BookRequest req) {
        Book book = Book.builder()
                .title(req.title())
                .author(req.author())
                .publisher(req.publisher())
                .price(req.price())
                .stock(req.stock())
                .coverUrl(req.coverUrl())
                .description(req.description())
                .build();
        bookRepository.save(book);
        return new BookSummary(book.getId(), book.getTitle(), book.getAuthor(), book.getPublisher(),
                book.getPrice(), book.getStock(), book.getCoverUrl(), book.getDescription(), book.getCreatedAt());
    }

    @Transactional
    public BookSummary updateBook(Long id, BookRequest req) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BOOK_NOT_FOUND", "Book not found"));
        book.update(req.title(), req.author(), req.publisher(),
                req.price(), req.stock(), req.coverUrl(), req.description());
        return new BookSummary(book.getId(), book.getTitle(), book.getAuthor(), book.getPublisher(),
                book.getPrice(), book.getStock(), book.getCoverUrl(), book.getDescription(), book.getUpdatedAt());
    }

    @Transactional
    public void deleteBook(Long id) {
        if (!bookRepository.existsById(id)) {
            throw new ApiException(HttpStatus.NOT_FOUND, "BOOK_NOT_FOUND", "Book not found");
        }
        bookRepository.deleteById(id);
    }

    // ── DTOs ───────────────────────────────────────────────────────────────────

    public record DashboardData(
            long totalUsers,
            long newUsersToday,
            long totalSessions,
            long activeSessions,
            long totalBooks,
            List<Map<String, Object>> dailySignups) {}

    public record UserSummary(
            Long id,
            String name,
            String email,
            String role,
            String subscriptionTier,
            LocalDateTime createdAt) {}

    public record SessionSummary(
            Long id,
            String userName,
            String userEmail,
            String positionTitle,
            String status,
            LocalDateTime startedAt,
            LocalDateTime endedAt) {}

    public record BookSummary(
            Long id,
            String title,
            String author,
            String publisher,
            Integer price,
            Integer stock,
            String coverUrl,
            String description,
            LocalDateTime createdAt) {}

    public record BookRequest(
            String title,
            String author,
            String publisher,
            Integer price,
            Integer stock,
            String coverUrl,
            String description) {}

    @Transactional
    public UserSummary changeUserSubscription(Long userId, String tier, int durationMonths) {
        subscriptionService.changeSubscription(userId, SubscriptionTier.valueOf(tier.toUpperCase()), durationMonths);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "User not found"));
        return new UserSummary(user.getId(), user.getName(), user.getEmail(),
                user.getRole().name(), user.getEffectiveTier().name(), user.getCreatedAt());
    }

    public record ChangeRoleRequest(String role) {}

    public record ChangeSubscriptionRequest(String tier, int durationMonths) {}

    // ── Orders (결제 관리) ─────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<OrderSummary> getOrders(int page, int size, String paymentStatus) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orders = (paymentStatus != null && !paymentStatus.isBlank())
                ? orderRepository.findByPaymentStatus(PaymentStatus.valueOf(paymentStatus.toUpperCase()), pageable)
                : orderRepository.findAll(pageable);
        return orders.map(this::toOrderSummary);
    }

    @Transactional
    public OrderSummary updatePaymentStatus(Long orderId, String status) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));
        order.updatePaymentStatus(PaymentStatus.valueOf(status.toUpperCase()));
        return toOrderSummary(order);
    }

    // ── Deliveries (배송 관리) ─────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<OrderSummary> getDeliveries(int page, int size, String deliveryStatus) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Order> orders = (deliveryStatus != null && !deliveryStatus.isBlank())
                ? orderRepository.findByOrderTypeAndDeliveryStatus(
                        OrderType.BOOK, DeliveryStatus.valueOf(deliveryStatus.toUpperCase()), pageable)
                : orderRepository.findByOrderType(OrderType.BOOK, pageable);
        return orders.map(this::toOrderSummary);
    }

    @Transactional
    public OrderSummary updateDelivery(Long orderId, String deliveryStatus, String trackingNumber) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "ORDER_NOT_FOUND", "Order not found"));
        order.updateDelivery(DeliveryStatus.valueOf(deliveryStatus.toUpperCase()), trackingNumber);
        return toOrderSummary(order);
    }

    private OrderSummary toOrderSummary(Order o) {
        List<OrderItemSummary> items = o.getItems().stream()
                .map(i -> new OrderItemSummary(i.getBookId(), i.getBookTitle(), i.getQuantity(), i.getUnitPrice()))
                .toList();
        return new OrderSummary(
                o.getId(), o.getOrderNumber(),
                o.getUser().getName(), o.getUser().getEmail(),
                o.getOrderType().name(), o.getTotalAmount(), o.getPaymentMethod(),
                o.getPaymentStatus().name(),
                o.getDeliveryStatus() != null ? o.getDeliveryStatus().name() : null,
                o.getTrackingNumber(), o.getDeliveryAddress(),
                o.getRecipientName(), o.getRecipientPhone(),
                items, o.getCreatedAt());
    }

    public record OrderSummary(
            Long id,
            String orderNumber,
            String userName,
            String userEmail,
            String orderType,
            Integer totalAmount,
            String paymentMethod,
            String paymentStatus,
            String deliveryStatus,
            String trackingNumber,
            String deliveryAddress,
            String recipientName,
            String recipientPhone,
            List<OrderItemSummary> items,
            LocalDateTime createdAt) {}

    public record OrderItemSummary(
            Long bookId,
            String bookTitle,
            Integer quantity,
            Integer unitPrice) {}

    public record UpdatePaymentStatusRequest(String paymentStatus) {}

    public record UpdateDeliveryRequest(String deliveryStatus, String trackingNumber) {}
}
