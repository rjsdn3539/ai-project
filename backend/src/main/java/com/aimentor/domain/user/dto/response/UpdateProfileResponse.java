package com.aimentor.domain.user.dto.response;

public record UpdateProfileResponse(
        Long id,
        String name,
        String email
) {
}
