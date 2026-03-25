package com.aimentor.domain.book.entity;

import com.aimentor.common.entity.BaseTimeEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "books")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Book extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false)
    private String author;

    @Column(unique = true)
    private Long itemId;

    private String isbn;

    @Column(unique = true)
    private String isbn13;

    private String publisher;

    private String categoryName;

    private Integer customerReviewRank;

    private Integer priceStandard;

    @Column(nullable = false)
    private Integer priceSales;

    @Column(nullable = false)
    private Integer stock;

    private String coverUrl;

    private String saleStatus;

    private String source;

    private LocalDateTime lastSyncedAt;

    @Lob
    @Column(columnDefinition = "TEXT")
    private String description;

    public void update(String title, String author, String publisher,
                       Integer priceSales, Integer stock, String coverUrl, String description) {
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.priceSales = priceSales;
        this.stock = stock;
        this.coverUrl = coverUrl;
        this.description = description;
    }

    public void applyAladinData(
            Long itemId,
            String isbn,
            String isbn13,
            String title,
            String author,
            String publisher,
            String description,
            String categoryName,
            String coverUrl,
            Integer customerReviewRank,
            Integer priceStandard,
            Integer priceSales,
            Integer stock,
            String saleStatus,
            String source,
            LocalDateTime lastSyncedAt
    ) {
        this.itemId = itemId;
        this.isbn = isbn;
        this.isbn13 = isbn13;
        this.title = title;
        this.author = author;
        this.publisher = publisher;
        this.description = description;
        this.categoryName = categoryName;
        this.coverUrl = coverUrl;
        this.customerReviewRank = customerReviewRank;
        this.priceStandard = priceStandard;
        this.priceSales = priceSales;
        this.stock = stock;
        this.saleStatus = saleStatus;
        this.source = source;
        this.lastSyncedAt = lastSyncedAt;
    }

    public Integer getPrice() {
        return priceSales;
    }
}
