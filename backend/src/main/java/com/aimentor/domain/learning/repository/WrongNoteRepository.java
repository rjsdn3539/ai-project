package com.aimentor.domain.learning.repository;

import com.aimentor.domain.learning.entity.WrongNote;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WrongNoteRepository extends JpaRepository<WrongNote, Long> {

    List<WrongNote> findByUserIdOrderBySolvedDateDescCreatedAtDesc(Long userId);

    Optional<WrongNote> findByIdAndUserId(Long id, Long userId);

    long countByUserId(Long userId);

    void deleteByUserId(Long userId);
}
