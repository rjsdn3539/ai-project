package com.aimentor.domain.interview.repository;

import com.aimentor.domain.interview.entity.InterviewQA;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterviewQARepository extends JpaRepository<InterviewQA, Long> {
    List<InterviewQA> findBySessionIdOrderByOrderNum(Long sessionId);
    int countBySessionId(Long sessionId);
}
