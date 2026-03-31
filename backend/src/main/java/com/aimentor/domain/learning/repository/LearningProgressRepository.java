package com.aimentor.domain.learning.repository;

import com.aimentor.domain.learning.entity.LearningProgress;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningProgressRepository extends JpaRepository<LearningProgress, Long> {

    List<LearningProgress> findByUserIdOrderByUpdatedAtDesc(Long userId);

    Optional<LearningProgress> findByUserIdAndSubjectAndDifficulty(Long userId, String subject, String difficulty);

    void deleteByUserIdAndSubjectAndDifficulty(Long userId, String subject, String difficulty);
}
