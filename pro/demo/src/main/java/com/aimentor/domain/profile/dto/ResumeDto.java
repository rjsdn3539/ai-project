package com.aimentor.domain.profile.dto;

import com.aimentor.domain.profile.entity.Resume;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.time.LocalDateTime;

public class ResumeDto {

    @Getter
    public static class Request {
        @NotBlank(message = "제목을 입력해주세요.")
        private String title;
        private String content;
    }

    @Getter
    public static class Response {
        private final Long id;
        private final String title;
        private final String content;
        private final String fileUrl;
        private final LocalDateTime createdAt;

        public Response(Resume r) {
            this.id        = r.getId();
            this.title     = r.getTitle();
            this.content   = r.getContent();
            this.fileUrl   = r.getFileUrl();
            this.createdAt = r.getCreatedAt();
        }
    }
}
