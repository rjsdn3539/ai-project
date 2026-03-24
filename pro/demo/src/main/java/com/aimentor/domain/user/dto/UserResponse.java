package com.aimentor.domain.user.dto;

import com.aimentor.domain.user.entity.User;
import lombok.Getter;

@Getter
public class UserResponse {
    private final Long id;
    private final String name;
    private final String email;
    private final String phone;
    private final String role;

    public UserResponse(User user) {
        this.id    = user.getId();
        this.name  = user.getName();
        this.email = user.getEmail();
        this.phone = user.getPhone();
        this.role  = user.getRole().name();
    }
}
