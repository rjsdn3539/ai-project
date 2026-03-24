package com.aimentor.domain.profile.service;

import com.aimentor.common.exception.BusinessException;
import com.aimentor.domain.profile.dto.*;
import com.aimentor.domain.profile.entity.*;
import com.aimentor.domain.profile.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 이력서 / 자기소개서 / 채용공고 CRUD 서비스
 * - 파일 업로드는 S3Service Mock으로 처리 (나중에 실제 S3 연동)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileService {

    private final ResumeRepository resumeRepo;
    private final CoverLetterRepository coverLetterRepo;
    private final JobPostingRepository jobPostingRepo;
    private final S3MockService s3Service; // TODO: 실제 S3 서비스로 교체

    // ─── Resume ───────────────────────────────────────────────

    public List<ResumeDto.Response> getResumes(Long userId) {
        return resumeRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(ResumeDto.Response::new).toList();
    }

    public ResumeDto.Response getResume(Long id, Long userId) {
        return new ResumeDto.Response(findResumeOrThrow(id, userId));
    }

    @Transactional
    public ResumeDto.Response createResume(ResumeDto.Request req, MultipartFile file, Long userId) {
        String fileUrl = file != null ? s3Service.upload(file, "resumes") : null;
        Resume resume = Resume.builder()
                .userId(userId)
                .title(req.getTitle())
                .content(req.getContent())
                .fileUrl(fileUrl)
                .build();
        return new ResumeDto.Response(resumeRepo.save(resume));
    }

    @Transactional
    public ResumeDto.Response updateResume(Long id, ResumeDto.Request req, MultipartFile file, Long userId) {
        Resume resume = findResumeOrThrow(id, userId);
        String fileUrl = file != null ? s3Service.upload(file, "resumes") : null;
        resume.update(req.getTitle(), req.getContent(), fileUrl);
        return new ResumeDto.Response(resume);
    }

    @Transactional
    public void deleteResume(Long id, Long userId) {
        resumeRepo.delete(findResumeOrThrow(id, userId));
    }

    private Resume findResumeOrThrow(Long id, Long userId) {
        return resumeRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> BusinessException.notFound("이력서를 찾을 수 없습니다."));
    }

    // ─── CoverLetter ──────────────────────────────────────────

    public List<CoverLetterDto.Response> getCoverLetters(Long userId) {
        return coverLetterRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(CoverLetterDto.Response::new).toList();
    }

    public CoverLetterDto.Response getCoverLetter(Long id, Long userId) {
        return new CoverLetterDto.Response(findCoverLetterOrThrow(id, userId));
    }

    @Transactional
    public CoverLetterDto.Response createCoverLetter(CoverLetterDto.Request req, Long userId) {
        CoverLetter cl = CoverLetter.builder()
                .userId(userId).title(req.getTitle()).content(req.getContent()).build();
        return new CoverLetterDto.Response(coverLetterRepo.save(cl));
    }

    @Transactional
    public CoverLetterDto.Response updateCoverLetter(Long id, CoverLetterDto.Request req, Long userId) {
        CoverLetter cl = findCoverLetterOrThrow(id, userId);
        cl.update(req.getTitle(), req.getContent());
        return new CoverLetterDto.Response(cl);
    }

    @Transactional
    public void deleteCoverLetter(Long id, Long userId) {
        coverLetterRepo.delete(findCoverLetterOrThrow(id, userId));
    }

    private CoverLetter findCoverLetterOrThrow(Long id, Long userId) {
        return coverLetterRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> BusinessException.notFound("자기소개서를 찾을 수 없습니다."));
    }

    // ─── JobPosting ───────────────────────────────────────────

    public List<JobPostingDto.Response> getJobPostings(Long userId) {
        return jobPostingRepo.findByUserIdOrderByCreatedAtDesc(userId)
                .stream().map(JobPostingDto.Response::new).toList();
    }

    public JobPostingDto.Response getJobPosting(Long id, Long userId) {
        return new JobPostingDto.Response(findJobPostingOrThrow(id, userId));
    }

    @Transactional
    public JobPostingDto.Response createJobPosting(JobPostingDto.Request req, MultipartFile file, Long userId) {
        String fileUrl = file != null ? s3Service.upload(file, "job-postings") : null;
        JobPosting jp = JobPosting.builder()
                .userId(userId).company(req.getCompany())
                .position(req.getPosition()).description(req.getDescription())
                .fileUrl(fileUrl).build();
        return new JobPostingDto.Response(jobPostingRepo.save(jp));
    }

    @Transactional
    public JobPostingDto.Response updateJobPosting(Long id, JobPostingDto.Request req, MultipartFile file, Long userId) {
        JobPosting jp = findJobPostingOrThrow(id, userId);
        String fileUrl = file != null ? s3Service.upload(file, "job-postings") : null;
        jp.update(req.getCompany(), req.getPosition(), req.getDescription(), fileUrl);
        return new JobPostingDto.Response(jp);
    }

    @Transactional
    public void deleteJobPosting(Long id, Long userId) {
        jobPostingRepo.delete(findJobPostingOrThrow(id, userId));
    }

    private JobPosting findJobPostingOrThrow(Long id, Long userId) {
        return jobPostingRepo.findByIdAndUserId(id, userId)
                .orElseThrow(() -> BusinessException.notFound("채용공고를 찾을 수 없습니다."));
    }
}
