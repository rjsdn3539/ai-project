package com.aimentor.domain.book.service;

import com.aimentor.common.exception.BusinessException;
import com.aimentor.domain.book.dto.*;
import com.aimentor.domain.book.entity.*;
import com.aimentor.domain.book.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 도서 / 장바구니 / 주문 비즈니스 로직
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepo;
    private final CartItemRepository cartRepo;
    private final OrderRepository orderRepo;

    // ─── Book ────────────────────────────────────────────────

    public Page<BookDto.Response> getBooks(String keyword, Pageable pageable) {
        if (StringUtils.hasText(keyword)) {
            return bookRepo.findByTitleContainingOrAuthorContaining(keyword, keyword, pageable)
                    .map(BookDto.Response::new);
        }
        return bookRepo.findAll(pageable).map(BookDto.Response::new);
    }

    public BookDto.Response getBook(Long id) {
        return new BookDto.Response(findBookOrThrow(id));
    }

    @Transactional
    public BookDto.Response createBook(BookDto.Request req) {
        Book book = Book.builder()
                .title(req.getTitle()).author(req.getAuthor()).publisher(req.getPublisher())
                .price(req.getPrice()).stock(req.getStock())
                .coverUrl(req.getCoverUrl()).description(req.getDescription())
                .build();
        return new BookDto.Response(bookRepo.save(book));
    }

    @Transactional
    public BookDto.Response updateBook(Long id, BookDto.Request req) {
        Book book = findBookOrThrow(id);
        book.update(req.getTitle(), req.getAuthor(), req.getPublisher(),
                req.getPrice(), req.getStock(), req.getCoverUrl(), req.getDescription());
        return new BookDto.Response(book);
    }

    @Transactional
    public void deleteBook(Long id) {
        bookRepo.delete(findBookOrThrow(id));
    }

    private Book findBookOrThrow(Long id) {
        return bookRepo.findById(id)
                .orElseThrow(() -> BusinessException.notFound("도서를 찾을 수 없습니다."));
    }

    // ─── Cart ────────────────────────────────────────────────

    public List<CartDto.Response> getCart(Long userId) {
        return cartRepo.findByUserId(userId).stream().map(CartDto.Response::new).toList();
    }

    @Transactional
    public CartDto.Response addToCart(CartDto.AddRequest req, Long userId) {
        Book book = findBookOrThrow(req.getBookId());
        CartItem item = cartRepo.findByUserIdAndBookId(userId, req.getBookId())
                .map(existing -> { existing.changeQuantity(existing.getQuantity() + req.getQuantity()); return existing; })
                .orElseGet(() -> cartRepo.save(
                        CartItem.builder().userId(userId).book(book).quantity(req.getQuantity()).build()));
        return new CartDto.Response(item);
    }

    @Transactional
    public CartDto.Response updateCartItem(Long bookId, CartDto.UpdateRequest req, Long userId) {
        CartItem item = cartRepo.findByUserIdAndBookId(userId, bookId)
                .orElseThrow(() -> BusinessException.notFound("장바구니 항목을 찾을 수 없습니다."));
        item.changeQuantity(req.getQuantity());
        return new CartDto.Response(item);
    }

    @Transactional
    public void removeFromCart(Long bookId, Long userId) {
        cartRepo.deleteByUserIdAndBookId(userId, bookId);
    }

    // ─── Order ───────────────────────────────────────────────

    /**
     * 주문 생성
     * - 장바구니 전체를 주문으로 변환
     * - 각 도서 재고 차감 (부족 시 OUT_OF_STOCK 에러)
     * - 결제 완료 시뮬레이션 (실제 PG 연동 없음)
     */
    @Transactional
    public OrderDto.Response createOrder(OrderDto.CreateRequest req, Long userId) {
        List<CartItem> cartItems = cartRepo.findByUserId(userId);
        if (cartItems.isEmpty()) {
            throw BusinessException.badRequest("장바구니가 비어있습니다.");
        }

        int totalPrice = 0;

        Order order = Order.builder()
                .userId(userId)
                .address(req.getAddress())
                .orderedAt(LocalDateTime.now())
                .totalPrice(0)
                .build();
        order = orderRepo.save(order);

        for (CartItem cartItem : cartItems) {
            Book book = cartItem.getBook();
            book.decreaseStock(cartItem.getQuantity()); // 재고 차감

            OrderItem oi = OrderItem.builder()
                    .order(order)
                    .book(book)
                    .quantity(cartItem.getQuantity())
                    .price(book.getPrice())
                    .build();
            order.getOrderItems().add(oi);
            totalPrice += book.getPrice() * cartItem.getQuantity();
        }

        // totalPrice 업데이트 — Order를 직접 수정하기 위해 새 order 생성
        Order finalOrder = Order.builder()
                .id(order.getId())
                .userId(userId)
                .address(req.getAddress())
                .orderedAt(order.getOrderedAt())
                .totalPrice(totalPrice)
                .status(OrderStatus.PAID)
                .build();
        finalOrder = orderRepo.save(finalOrder);

        cartRepo.deleteAllByUserId(userId);

        return new OrderDto.Response(orderRepo.findById(finalOrder.getId()).orElseThrow());
    }

    public List<OrderDto.Response> getOrders(Long userId) {
        return orderRepo.findByUserIdOrderByOrderedAtDesc(userId)
                .stream().map(OrderDto.Response::new).toList();
    }

    public OrderDto.Response getOrder(Long id, Long userId) {
        Order order = orderRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> BusinessException.notFound("주문을 찾을 수 없습니다."));
        return new OrderDto.Response(order);
    }
}
