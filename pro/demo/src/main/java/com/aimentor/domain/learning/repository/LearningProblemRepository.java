package com.aimentor.domain.learning.repository;

import com.aimentor.domain.learning.entity.LearningProblem;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningProblemRepository extends JpaRepository<LearningProblem, Long> {
}
