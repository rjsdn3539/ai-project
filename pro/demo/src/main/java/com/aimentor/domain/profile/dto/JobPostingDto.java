package com.aimentor.domain.profile.dto;

import com.aimentor.domain.profile.entity.JobPosting;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.time.LocalDateTime;

public class JobPostingDto {

    @Getter
    public static class Request {
        @NotBlank(message = "회사명을 입력해주세요.")
        private String company;
        @NotBlank(message = "직책을 입력해주세요.")
        private String position;
        private String description;
    }

    @Getter
    public static class Response {
        private final Long id;
        private final String company;
        private final String position;
        private final String description;
        private final String fileUrl;
        private final LocalDateTime createdAt;

        public Response(JobPosting jp) {
            this.id          = jp.getId();
            this.company     = jp.getCompany();
            this.position    = jp.getPosition();
            this.description = jp.getDescription();
            this.fileUrl     = jp.getFileUrl();
            this.createdAt   = jp.getCreatedAt();
        }
    }
}
