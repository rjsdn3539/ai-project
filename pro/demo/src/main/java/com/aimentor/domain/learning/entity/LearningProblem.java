package com.aimentor.domain.learning.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.List;

/** AI가 생성한 학습 문제 */
@Entity
@Table(name = "learning_problems")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class LearningProblem extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String subject;

    @Column(nullable = false)
    private String difficulty; // EASY | MEDIUM | HARD

    @Column(nullable = false)
    private String type; // MULTIPLE | SHORT

    @Lob @Column(nullable = false)
    private String question;

    // 객관식 선택지 — JSON 문자열로 저장 (간단 구현)
    @Lob
    private String choicesJson;

    @Column(nullable = false)
    private String answer;

    @Lob
    private String explanation;
}
