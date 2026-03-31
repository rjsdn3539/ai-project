package com.aimentor.domain.user.repository;

import com.aimentor.domain.user.entity.User;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface UserRepository extends JpaRepository<User, Long> {

    boolean existsByEmail(String email);

    Optional<User> findByEmail(String email);

    Optional<User> findByRefreshToken(String refreshToken);

    Page<User> findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(
            String name, String email, Pageable pageable);

    long countByCreatedAtBetween(LocalDateTime start, LocalDateTime end);

    @Query(value = "SELECT DATE(created_at) as date, COUNT(*) as count FROM users " +
            "WHERE created_at >= :since GROUP BY DATE(created_at) ORDER BY date",
            nativeQuery = true)
    List<Object[]> countDailySignups(@Param("since") LocalDateTime since);
}
