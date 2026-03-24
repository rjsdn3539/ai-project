package com.aimentor.domain.book.repository;

import com.aimentor.domain.book.entity.Book;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface BookRepository extends JpaRepository<Book, Long> {
    Page<Book> findByTitleContainingOrAuthorContaining(String title, String author, Pageable pageable);
}
