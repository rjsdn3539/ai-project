package com.aimentor.domain.profile.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.profile.dto.request.JobPostingUpsertRequest;
import com.aimentor.domain.profile.dto.response.JobPostingResponse;
import com.aimentor.domain.profile.dto.response.ParseJobPostingUrlResponse;
import com.aimentor.domain.profile.entity.JobPosting;
import com.aimentor.domain.profile.repository.JobPostingRepository;
import com.aimentor.domain.subscription.SubscriptionService;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import com.aimentor.external.ai.AiIntegrationService;
import com.aimentor.external.ai.dto.AiParseJobPostingRequest;
import com.aimentor.external.ai.dto.AiParseJobPostingResponse;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class JobPostingService {

    private final JobPostingRepository jobPostingRepository;
    private final UserRepository userRepository;
    private final SubscriptionService subscriptionService;
    private final AiIntegrationService aiIntegrationService;

    public JobPostingService(JobPostingRepository jobPostingRepository, UserRepository userRepository,
                             SubscriptionService subscriptionService, AiIntegrationService aiIntegrationService) {
        this.jobPostingRepository = jobPostingRepository;
        this.userRepository = userRepository;
        this.subscriptionService = subscriptionService;
        this.aiIntegrationService = aiIntegrationService;
    }

    @Transactional
    public JobPostingResponse create(Long userId, JobPostingUpsertRequest request) {
        User user = getUser(userId);
        JobPosting jobPosting = JobPosting.builder()
                .user(user)
                .companyName(request.companyName())
                .positionTitle(request.positionTitle())
                .description(request.description())
                .jobUrl(request.jobUrl())
                .deadline(request.deadline())
                .build();
        return toResponse(jobPostingRepository.save(jobPosting));
    }

    public List<JobPostingResponse> list(Long userId, String keyword) {
        List<JobPosting> jobPostings = keyword == null || keyword.isBlank()
                ? jobPostingRepository.findByUserIdOrderByUpdatedAtDesc(userId)
                : jobPostingRepository.findByUserIdAndPositionTitleContainingIgnoreCaseOrderByUpdatedAtDesc(userId, keyword);
        return jobPostings.stream().map(this::toResponse).toList();
    }

    public JobPostingResponse get(Long userId, Long jobPostingId) {
        return toResponse(getOwnedJobPosting(userId, jobPostingId));
    }

    @Transactional
    public JobPostingResponse update(Long userId, Long jobPostingId, JobPostingUpsertRequest request) {
        JobPosting jobPosting = getOwnedJobPosting(userId, jobPostingId);
        jobPosting.update(
                request.companyName(),
                request.positionTitle(),
                request.description(),
                request.jobUrl(),
                request.deadline()
        );
        return toResponse(jobPosting);
    }

    @Transactional
    public void delete(Long userId, Long jobPostingId) {
        JobPosting jobPosting = getOwnedJobPosting(userId, jobPostingId);
        jobPostingRepository.delete(jobPosting);
    }

    public ParseJobPostingUrlResponse parseUrl(String url, String content) {
        AiParseJobPostingResponse result = aiIntegrationService.parseJobPosting(new AiParseJobPostingRequest(url, content));
        return new ParseJobPostingUrlResponse(result.companyName(), result.positionTitle(), result.description());
    }

    private User getUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
    }

    private JobPosting getOwnedJobPosting(Long userId, Long jobPostingId) {
        return jobPostingRepository.findByIdAndUserId(jobPostingId, userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "JOB_POSTING_NOT_FOUND", "채용공고를 찾을 수 없습니다."));
    }

    private JobPostingResponse toResponse(JobPosting jobPosting) {
        return new JobPostingResponse(
                jobPosting.getId(),
                jobPosting.getCompanyName(),
                jobPosting.getPositionTitle(),
                jobPosting.getDescription(),
                jobPosting.getJobUrl(),
                jobPosting.getDeadline(),
                jobPosting.getCreatedAt(),
                jobPosting.getUpdatedAt()
        );
    }
}
