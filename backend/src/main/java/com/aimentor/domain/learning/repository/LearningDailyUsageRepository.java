package com.aimentor.domain.learning.repository;

import com.aimentor.domain.learning.entity.LearningDailyUsage;
import java.time.LocalDate;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LearningDailyUsageRepository extends JpaRepository<LearningDailyUsage, Long> {

    Optional<LearningDailyUsage> findByUserIdAndUsageDate(Long userId, LocalDate usageDate);
}
