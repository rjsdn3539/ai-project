package com.aimentor.domain.book.repository;

import com.aimentor.domain.book.entity.Book;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {

    Optional<Book> findByItemId(Long itemId);

    Optional<Book> findByIsbn13(String isbn13);

    Page<Book> findByTitleContainingIgnoreCaseOrAuthorContainingIgnoreCase(
            String title, String author, Pageable pageable);

    void deleteBySource(String source);
}
