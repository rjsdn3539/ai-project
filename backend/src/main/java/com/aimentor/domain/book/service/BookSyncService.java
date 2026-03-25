package com.aimentor.domain.book.service;

import com.aimentor.domain.book.dto.request.SyncAladinBooksRequest;
import com.aimentor.domain.book.dto.response.AladinBookItemResponse;
import com.aimentor.domain.book.dto.response.AladinItemListResponse;
import com.aimentor.domain.book.dto.response.SyncAladinBooksResponse;
import com.aimentor.domain.book.entity.Book;
import com.aimentor.domain.book.repository.BookRepository;
import com.aimentor.external.aladin.AladinBookService;
import java.time.LocalDateTime;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class BookSyncService {

    private static final String DEFAULT_SEARCH_TARGET = "Book";
    private static final String DEFAULT_CATEGORY_ID = "27660";
    private static final int DEFAULT_MAX_RESULTS = 10;
    private static final int DEFAULT_START = 1;
    private static final int DEFAULT_STOCK = 10;
    private static final String DEFAULT_SALE_STATUS = "ON_SALE";
    private static final String SOURCE_ALADIN = "ALADIN";

    private final AladinBookService aladinBookService;
    private final BookRepository bookRepository;

    @Transactional
    public SyncAladinBooksResponse syncAladinBooks(SyncAladinBooksRequest request) {
        AladinItemListResponse response = aladinBookService.searchBooks(
                request.query().trim(),
                request.searchTarget() == null || request.searchTarget().isBlank() ? DEFAULT_SEARCH_TARGET : request.searchTarget(),
                request.categoryId() == null || request.categoryId().isBlank() ? DEFAULT_CATEGORY_ID : request.categoryId(),
                request.maxResults() == null ? DEFAULT_MAX_RESULTS : request.maxResults(),
                request.start() == null ? DEFAULT_START : request.start()
        );

        int createdCount = 0;
        int updatedCount = 0;
        int stock = request.stock() == null ? DEFAULT_STOCK : request.stock();
        String saleStatus = request.saleStatus() == null || request.saleStatus().isBlank()
                ? DEFAULT_SALE_STATUS
                : request.saleStatus().trim();
        LocalDateTime syncedAt = LocalDateTime.now();

        for (AladinBookItemResponse item : response.items()) {
            Book book = findExistingBook(item)
                    .orElseGet(() -> Book.builder()
                            .title(defaultTitle(item.title()))
                            .author(defaultAuthor(item.author()))
                            .priceSales(defaultPrice(item.priceSales(), item.priceStandard()))
                            .stock(stock)
                            .saleStatus(saleStatus)
                            .source(SOURCE_ALADIN)
                            .build());

            boolean isNew = book.getId() == null;
            book.applyAladinData(
                    item.itemId(),
                    item.isbn(),
                    item.isbn13(),
                    defaultTitle(item.title()),
                    defaultAuthor(item.author()),
                    item.publisher(),
                    item.description(),
                    item.categoryName(),
                    item.cover(),
                    item.customerReviewRank(),
                    defaultPrice(item.priceStandard(), item.priceSales()),
                    defaultPrice(item.priceSales(), item.priceStandard()),
                    stock,
                    saleStatus,
                    SOURCE_ALADIN,
                    syncedAt
            );
            bookRepository.save(book);
            if (isNew) {
                createdCount++;
            } else {
                updatedCount++;
            }
        }

        return new SyncAladinBooksResponse(
                response.items().size(),
                createdCount + updatedCount,
                createdCount,
                updatedCount
        );
    }

    private java.util.Optional<Book> findExistingBook(AladinBookItemResponse item) {
        if (item.itemId() != null) {
            java.util.Optional<Book> byItemId = bookRepository.findByItemId(item.itemId());
            if (byItemId.isPresent()) {
                return byItemId;
            }
        }
        if (item.isbn13() != null && !item.isbn13().isBlank()) {
            return bookRepository.findByIsbn13(item.isbn13());
        }
        return java.util.Optional.empty();
    }

    private Integer defaultPrice(Integer primary, Integer fallback) {
        if (primary != null) {
            return primary;
        }
        if (fallback != null) {
            return fallback;
        }
        return 0;
    }

    private String defaultTitle(String value) {
        return value == null || value.isBlank() ? "제목 없음" : value.trim();
    }

    private String defaultAuthor(String value) {
        return value == null || value.isBlank() ? "저자 미상" : value.trim();
    }
}
