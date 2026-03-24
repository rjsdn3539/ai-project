package com.aimentor.domain.learning.repository;

import com.aimentor.domain.learning.entity.LearningAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LearningAttemptRepository extends JpaRepository<LearningAttempt, Long> {
    long countByUserId(Long userId);

    @Query("SELECT COUNT(a) FROM LearningAttempt a WHERE a.userId = :userId AND a.isCorrect = true")
    long countCorrectByUserId(Long userId);
}
