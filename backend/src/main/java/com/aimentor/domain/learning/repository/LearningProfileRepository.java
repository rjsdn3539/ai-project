package com.aimentor.domain.learning.repository;

import com.aimentor.domain.learning.entity.LearningProfile;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningProfileRepository extends JpaRepository<LearningProfile, Long> {

    Optional<LearningProfile> findByUserId(Long userId);
}
