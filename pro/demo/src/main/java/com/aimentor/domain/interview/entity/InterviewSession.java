package com.aimentor.domain.interview.entity;

import com.aimentor.common.BaseTimeEntity;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

/** 면접 세션 엔티티 — 하나의 모의 면접 시작부터 끝까지 */
@Entity
@Table(name = "interview_sessions")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class InterviewSession extends BaseTimeEntity {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long userId;

    private Long resumeId;
    private Long coverLetterId;
    private Long jobPostingId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.ONGOING;

    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    @OneToMany(mappedBy = "session", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<InterviewQA> qaList = new ArrayList<>();

    @OneToOne(mappedBy = "session", cascade = CascadeType.ALL)
    private InterviewFeedback feedback;

    public void end() {
        this.status  = SessionStatus.COMPLETED;
        this.endedAt = LocalDateTime.now();
    }
}
