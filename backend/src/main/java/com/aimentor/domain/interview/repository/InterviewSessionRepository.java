package com.aimentor.domain.interview.repository;

import com.aimentor.domain.interview.entity.InterviewSession;
import com.aimentor.domain.interview.entity.InterviewSessionStatus;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {

    @EntityGraph(attributePaths = {"questions", "questions.answer", "feedback"})
    Optional<InterviewSession> findByIdAndUserId(Long id, Long userId);

    @Override
    @EntityGraph(attributePaths = {"user"})
    Page<InterviewSession> findAll(Pageable pageable);

    @EntityGraph(attributePaths = {"questions", "questions.answer", "feedback"})
    List<InterviewSession> findByUserIdOrderByStartedAtDesc(Long userId);

    @EntityGraph(attributePaths = {"user"})
    Page<InterviewSession> findByStatus(InterviewSessionStatus status, Pageable pageable);

    long countByStatus(InterviewSessionStatus status);

    long countByUserIdAndStartedAtAfter(Long userId, LocalDateTime after);
}
