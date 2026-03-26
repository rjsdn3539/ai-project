package com.aimentor.domain.learning.entity;

import com.aimentor.common.entity.BaseTimeEntity;
import com.aimentor.domain.user.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AccessLevel;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@Entity
@Table(name = "wrong_notes")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class WrongNote extends BaseTimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private LocalDate solvedDate;

    @Column(nullable = false, length = 100)
    private String subject;

    @Column(length = 20)
    private String difficulty;

    @Column(nullable = false, length = 2000)
    private String question;

    @Column(length = 30)
    private String type;

    @Column(columnDefinition = "TEXT")
    private String choicesJson;

    @Column(length = 1000)
    private String answer;

    @Column(length = 1000)
    private String userAnswer;

    @Column(columnDefinition = "TEXT")
    private String aiFeedback;

    @Column(columnDefinition = "TEXT")
    private String explanation;

    @Builder
    public WrongNote(
            User user,
            LocalDate solvedDate,
            String subject,
            String difficulty,
            String question,
            String type,
            String choicesJson,
            String answer,
            String userAnswer,
            String aiFeedback,
            String explanation
    ) {
        this.user = user;
        this.solvedDate = solvedDate;
        this.subject = subject;
        this.difficulty = difficulty;
        this.question = question;
        this.type = type;
        this.choicesJson = choicesJson;
        this.answer = answer;
        this.userAnswer = userAnswer;
        this.aiFeedback = aiFeedback;
        this.explanation = explanation;
    }
}
