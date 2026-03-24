package com.aimentor.domain.interview.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

/** 면접 질문 + 답변 쌍 */
@Entity
@Table(name = "interview_qa")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InterviewQA extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "session_id", nullable = false)
    private InterviewSession session;

    @Column(nullable = false)
    private Integer orderNum; // 질문 순서

    @Lob
    @Column(nullable = false)
    private String question;

    @Lob
    private String answerText; // STT 변환 텍스트

    private String audioUrl; // S3에 저장된 음성 파일 URL

    public void setAnswer(String answerText, String audioUrl) {
        this.answerText = answerText;
        this.audioUrl   = audioUrl;
    }
}
