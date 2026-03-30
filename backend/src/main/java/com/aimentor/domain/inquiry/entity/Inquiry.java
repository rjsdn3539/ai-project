package com.aimentor.domain.inquiry.entity;

import com.aimentor.common.entity.BaseTimeEntity;
import com.aimentor.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "inquiries")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Inquiry extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 50)
    private String name;

    @Column(nullable = false, length = 100)
    private String email;

    @Column(nullable = false, length = 100)
    private String category;

    @Column(nullable = false, length = 200)
    private String subject;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private InquiryStatus status;

    @Column(columnDefinition = "TEXT")
    private String adminAnswer;

    @Column(length = 50)
    private String answeredBy;

    private LocalDateTime answeredAt;

    @Builder
    public Inquiry(User user, String name, String email, String category, String subject, String message) {
        this.user = user;
        this.name = name;
        this.email = email;
        this.category = category;
        this.subject = subject;
        this.message = message;
        this.status = InquiryStatus.PENDING;
    }

    public void answer(String adminAnswer, String answeredBy) {
        this.adminAnswer = adminAnswer;
        this.answeredBy = answeredBy;
        this.answeredAt = LocalDateTime.now();
        this.status = InquiryStatus.ANSWERED;
    }
}
