package com.aimentor.domain.profile.repository;

import com.aimentor.domain.profile.entity.JobPosting;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface JobPostingRepository extends JpaRepository<JobPosting, Long> {
    List<JobPosting> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<JobPosting> findByIdAndUserId(Long id, Long userId);
}
