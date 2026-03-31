package com.aimentor.domain.inquiry.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateInquiryRequest(
        @NotBlank(message = "이름을 입력해주세요.")
        @Size(max = 50, message = "이름은 50자 이하로 입력해주세요.")
        String name,

        @NotBlank(message = "이메일을 입력해주세요.")
        @Email(message = "올바른 이메일 형식을 입력해주세요.")
        @Size(max = 100, message = "이메일은 100자 이하로 입력해주세요.")
        String email,

        @NotBlank(message = "문의 유형을 선택해주세요.")
        @Size(max = 100, message = "문의 유형은 100자 이하로 입력해주세요.")
        String category,

        @NotBlank(message = "제목을 입력해주세요.")
        @Size(max = 200, message = "제목은 200자 이하로 입력해주세요.")
        String subject,

        @NotBlank(message = "문의 내용을 입력해주세요.")
        @Size(min = 10, max = 5000, message = "문의 내용은 10자 이상 5000자 이하로 입력해주세요.")
        String message
) {
}
