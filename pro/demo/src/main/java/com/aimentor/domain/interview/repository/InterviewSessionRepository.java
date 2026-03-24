package com.aimentor.domain.interview.repository;

import com.aimentor.domain.interview.entity.InterviewSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;

public interface InterviewSessionRepository extends JpaRepository<InterviewSession, Long> {
    List<InterviewSession> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<InterviewSession> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT COUNT(s) FROM InterviewSession s WHERE s.status = 'ONGOING'")
    long countOngoing();
}
