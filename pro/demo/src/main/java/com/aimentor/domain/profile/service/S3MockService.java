package com.aimentor.domain.profile.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

/**
 * S3 업로드 Mock 구현체
 * TODO: 실제 S3 연동 시 이 클래스를 S3Service로 교체
 *       (io.awspring.cloud:spring-cloud-aws-starter-s3 사용)
 */
@Slf4j
@Service
public class S3MockService {

    /**
     * 파일 업로드 시뮬레이션
     * @param file   업로드할 파일
     * @param folder S3 폴더명 (e.g. "resumes", "job-postings")
     * @return 가상의 S3 URL
     */
    public String upload(MultipartFile file, String folder) {
        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        String mockUrl  = "https://mock-s3.example.com/" + folder + "/" + fileName;
        log.info("[S3Mock] Uploading {} -> {}", file.getOriginalFilename(), mockUrl);
        return mockUrl;
    }

    public void delete(String fileUrl) {
        log.info("[S3Mock] Deleting {}", fileUrl);
    }
}
