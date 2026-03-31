package com.aimentor.domain.interview.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/** AI가 생성한 면접 피드백 */
@Entity
@Table(name = "interview_feedbacks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InterviewFeedback extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    private Integer logicScore;       // 논리성 점수 (0~100)
    private Integer relevanceScore;   // 적절성 점수
    private Integer specificityScore; // 구체성 점수
    private Integer overallScore;     // 종합 점수

    @Lob
    private String weakPoints;        // 부족한 부분

    @Lob
    private String improvements;      // 개선 방향

    @Lob
    private String recommendedAnswer; // AI 추천 답변
}
