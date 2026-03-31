package com.aimentor.domain.book.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.book.dto.response.BookResponse;
import com.aimentor.domain.book.entity.Book;
import com.aimentor.domain.book.repository.BookRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class BookService {

    private final BookRepository bookRepository;

    public BookService(BookRepository bookRepository) {
        this.bookRepository = bookRepository;
    }

    public Page<BookResponse> getBooks(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "id"));
        if (keyword == null || keyword.isBlank()) {
            return bookRepository.findAll(pageable).map(this::toBookResponse);
        }
        return bookRepository.findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(keyword, keyword, pageable)
                .map(this::toBookResponse);
    }

    public BookResponse getBook(Long bookId) {
        Book book = bookRepository.findById(bookId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "BOOK_NOT_FOUND", "Book not found"));
        return toBookResponse(book);
    }

    private BookResponse toBookResponse(Book book) {
        return new BookResponse(
                book.getId(),
                book.getItemId(),
                book.getIsbn(),
                book.getIsbn13(),
                book.getTitle(),
                book.getAuthor(),
                book.getPublisher(),
                book.getDescription(),
                book.getCategoryName(),
                book.getCustomerReviewRank(),
                book.getPriceStandard(),
                book.getPrice(),
                book.getPriceSales(),
                book.getStock(),
                book.getSaleStatus(),
                book.getSource(),
                book.getCoverUrl(),
                book.getLastSyncedAt(),
                book.getCreatedAt(),
                book.getUpdatedAt()
        );
    }
}

