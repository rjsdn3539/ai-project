package com.aimentor.domain.profile.dto;

import com.aimentor.domain.profile.entity.CoverLetter;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;

import java.time.LocalDateTime;

public class CoverLetterDto {

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
        private final LocalDateTime createdAt;

        public Response(CoverLetter cl) {
            this.id        = cl.getId();
            this.title     = cl.getTitle();
            this.content   = cl.getContent();
            this.createdAt = cl.getCreatedAt();
        }
    }
}
