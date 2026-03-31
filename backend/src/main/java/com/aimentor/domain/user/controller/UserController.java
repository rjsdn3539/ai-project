package com.aimentor.domain.user.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.domain.user.dto.request.ChangePasswordRequest;
import com.aimentor.domain.user.dto.request.UpdateProfileRequest;
import com.aimentor.domain.user.dto.response.UpdateProfileResponse;
import com.aimentor.domain.user.service.UserService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PatchMapping("/me")
    public ApiResponse<UpdateProfileResponse> updateProfile(
            @AuthenticationPrincipal AuthenticatedUser auth,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.success(userService.updateProfile(auth.userId(), request));
    }

    @GetMapping("/me/widgets")
    public ApiResponse<String> getWidgetConfig(
            @AuthenticationPrincipal AuthenticatedUser auth) {
        return ApiResponse.success(userService.getWidgetConfig(auth.userId()));
    }

    @PatchMapping("/me/widgets")
    public ApiResponse<Void> saveWidgetConfig(
            @AuthenticationPrincipal AuthenticatedUser auth,
            @RequestBody Map<String, String> body) {
        userService.saveWidgetConfig(auth.userId(), body.get("config"));
        return ApiResponse.success();
    }

    @PatchMapping("/me/password")
    public ApiResponse<Void> changePassword(
            @AuthenticationPrincipal AuthenticatedUser auth,
            @Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(auth.userId(), request);
        return ApiResponse.success();
    }
}
