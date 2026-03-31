package com.aimentor.domain.inquiry.repository;

import com.aimentor.domain.inquiry.entity.Inquiry;
import com.aimentor.domain.inquiry.entity.InquiryStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface InquiryRepository extends JpaRepository<Inquiry, Long> {

    Page<Inquiry> findByUserId(Long userId, Pageable pageable);

    Page<Inquiry> findByUserIdAndStatus(Long userId, InquiryStatus status, Pageable pageable);

    Page<Inquiry> findByStatus(InquiryStatus status, Pageable pageable);

    @Query("""
            select inquiry
            from Inquiry inquiry
            where (:status is null or inquiry.status = :status)
              and (
                :keyword is null
                or lower(inquiry.name) like lower(concat('%', :keyword, '%'))
                or lower(inquiry.email) like lower(concat('%', :keyword, '%'))
                or lower(inquiry.category) like lower(concat('%', :keyword, '%'))
                or lower(inquiry.subject) like lower(concat('%', :keyword, '%'))
                or lower(inquiry.message) like lower(concat('%', :keyword, '%'))
              )
            """)
    Page<Inquiry> searchForAdmin(
            @Param("status") InquiryStatus status,
            @Param("keyword") String keyword,
            Pageable pageable
    );
}
