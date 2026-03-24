package com.aimentor.domain.book.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/** 도서 엔티티 */
@Entity
@Table(name = "books")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Book extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    private String publisher;

    @Column(nullable = false)
    private Integer price;

    @Column(nullable = false)
    private Integer stock;

    private String coverUrl;

    @Lob
    private String description;

    public void update(String title, String author, String publisher,
                       Integer price, Integer stock, String coverUrl, String description) {
        this.title       = title;
        this.author      = author;
        this.publisher   = publisher;
        this.price       = price;
        this.stock       = stock;
        this.coverUrl    = coverUrl;
        this.description = description;
    }

    /** 재고 차감 — 부족 시 예외 */
    public void decreaseStock(int quantity) {
        if (this.stock < quantity) {
            throw com.aimentor.common.exception.BusinessException.outOfStock();
        }
        this.stock -= quantity;
    }
}
