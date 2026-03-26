package com.aimentor.domain.learning.repository;

import com.aimentor.domain.learning.entity.InterviewBookmark;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InterviewBookmarkRepository extends JpaRepository<InterviewBookmark, Long> {

    List<InterviewBookmark> findByUserIdOrderByBookmarkedAtDescCreatedAtDesc(Long userId);

    Optional<InterviewBookmark> findByUserIdAndBookmarkKey(Long userId, String bookmarkKey);

    void deleteByUserIdAndBookmarkKey(Long userId, String bookmarkKey);
}
