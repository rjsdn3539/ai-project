package com.aimentor.domain.profile.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.profile.dto.request.ResumeUpsertRequest;
import com.aimentor.domain.profile.dto.response.ResumeResponse;
import com.aimentor.domain.profile.entity.Resume;
import com.aimentor.domain.profile.repository.ResumeRepository;
import com.aimentor.domain.subscription.SubscriptionService;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@Transactional(readOnly = true)
public class ResumeService {

    private final ResumeRepository resumeRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final ProfileDocumentTextExtractor documentTextExtractor;

    public ResumeService(ResumeRepository resumeRepository, UserRepository userRepository,
                         SubscriptionService subscriptionService,
                         ProfileDocumentTextExtractor documentTextExtractor) {
        this.resumeRepository = resumeRepository;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
        this.documentTextExtractor = documentTextExtractor;
    }

    @Transactional
    public ResumeResponse create(Long userId, ResumeUpsertRequest request) {
        User user = getUser(userId);
        Resume resume = Resume.builder()
                .user(user)
                .title(request.title())
                .content(request.content())
                .build();
        return toResponse(resumeRepository.save(resume));
    }

    @Transactional
    public ResumeResponse createFromFile(Long userId, String title, MultipartFile file) {
        User user = getUser(userId);
        String extractedContent = documentTextExtractor.extract(file);
        Resume resume = Resume.builder()
                .user(user)
                .title(title)
                .content(extractedContent)
                .build();
        return toResponse(resumeRepository.save(resume));
    }

    public List<ResumeResponse> list(Long userId, String keyword) {
        List<Resume> resumes = keyword == null || keyword.isBlank()
                ? resumeRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                : resumeRepository.findByUserIdAndTitleContainingIgnoreCaseOrderByUpdatedAtDesc(userId, keyword);
        return resumes.stream().map(this::toResponse).toList();
    }

    public ResumeResponse get(Long userId, Long resumeId) {
        return toResponse(getOwnedResume(userId, resumeId));
    }

    @Transactional
    public ResumeResponse update(Long userId, Long resumeId, ResumeUpsertRequest request) {
        Resume resume = getOwnedResume(userId, resumeId);
        resume.update(request.title(), request.content());
        return toResponse(resume);
    }

    @Transactional
    public void delete(Long userId, Long resumeId) {
        Resume resume = getOwnedResume(userId, resumeId);
        resumeRepository.delete(resume);
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
    }

    private Resume getOwnedResume(Long userId, Long resumeId) {
        return resumeRepository.findByIdAndUserId(resumeId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "RESUME_NOT_FOUND", "이력서를 찾을 수 없습니다."));
    }

    private ResumeResponse toResponse(Resume resume) {
        return new ResumeResponse(
                resume.getId(),
                resume.getTitle(),
                resume.getContent(),
                resume.getCreatedAt(),
                resume.getUpdatedAt()
        );
    }
}
