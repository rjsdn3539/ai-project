package com.aimentor.domain.inquiry.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.inquiry.dto.request.AnswerInquiryRequest;
import com.aimentor.domain.inquiry.dto.request.CreateInquiryRequest;
import com.aimentor.domain.inquiry.dto.response.InquiryPageResponse;
import com.aimentor.domain.inquiry.dto.response.InquiryResponse;
import com.aimentor.domain.inquiry.entity.Inquiry;
import com.aimentor.domain.inquiry.entity.InquiryStatus;
import com.aimentor.domain.inquiry.repository.InquiryRepository;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class InquiryService {

    private final InquiryRepository inquiryRepository;
    private final UserRepository userRepository;

    @Transactional
    public InquiryResponse createInquiry(Long userId, CreateInquiryRequest request) {
        User user = getUser(userId);

        Inquiry inquiry = Inquiry.builder()
                .user(user)
                .name(request.name().trim())
                .email(request.email().trim())
                .category(request.category().trim())
                .subject(request.subject().trim())
                .message(request.message().trim())
                .build();

        return toResponse(inquiryRepository.save(inquiry));
    }

    @Transactional(readOnly = true)
    public InquiryPageResponse getUserInquiries(Long userId, int page, int size, String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        InquiryStatus inquiryStatus = parseStatus(status);
        Page<InquiryResponse> result = (inquiryStatus == null
                ? inquiryRepository.findByUserId(userId, pageable)
                : inquiryRepository.findByUserIdAndStatus(userId, inquiryStatus, pageable))
                .map(this::toResponse);

        return InquiryPageResponse.of(result);
    }

    @Transactional(readOnly = true)
    public InquiryPageResponse getAllInquiries(int page, int size, String status, String search) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        InquiryStatus inquiryStatus = parseStatus(status);
        String normalizedSearch = normalizeSearch(search);
        Page<InquiryResponse> result = inquiryRepository.searchForAdmin(inquiryStatus, normalizedSearch, pageable)
                .map(this::toResponse);

        return InquiryPageResponse.of(result);
    }

    @Transactional
    public InquiryResponse answerInquiry(Long inquiryId, Long adminUserId, AnswerInquiryRequest request) {
        Inquiry inquiry = inquiryRepository.findById(inquiryId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "INQUIRY_NOT_FOUND", "문의 내역을 찾을 수 없습니다."));
        User adminUser = getUser(adminUserId);

        inquiry.answer(request.answer().trim(), adminUser.getName());
        return toResponse(inquiry);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
    }

    private InquiryStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }

        try {
            return InquiryStatus.valueOf(status.trim().toUpperCase());
        } catch (IllegalArgumentException exception) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_INQUIRY_STATUS", "유효하지 않은 문의 상태입니다.");
        }
    }

    private String normalizeSearch(String search) {
        if (search == null || search.isBlank()) {
            return null;
        }
        return search.trim();
    }

    private InquiryResponse toResponse(Inquiry inquiry) {
        return new InquiryResponse(
                inquiry.getId(),
                inquiry.getName(),
                inquiry.getEmail(),
                inquiry.getCategory(),
                inquiry.getSubject(),
                inquiry.getMessage(),
                inquiry.getStatus().name(),
                inquiry.getAdminAnswer(),
                inquiry.getAnsweredBy(),
                inquiry.getAnsweredAt(),
                inquiry.getCreatedAt(),
                inquiry.getUpdatedAt()
        );
    }
}
