package com.aimentor.domain.learning.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/** 사용자의 문제 풀이 기록 */
@Entity
@Table(name = "learning_attempts")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LearningAttempt extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private LearningProblem problem;

    @Column(nullable = false)
    private String userAnswer;

    @Column(nullable = false)
    private Boolean isCorrect;

    @Lob
    private String aiFeedback;
}
