package com.aimentor.domain.user.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.user.dto.request.ChangePasswordRequest;
import com.aimentor.domain.user.dto.request.UpdateProfileRequest;
import com.aimentor.domain.user.dto.response.UpdateProfileResponse;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UpdateProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = findUser(userId);
        user.updateName(request.name().trim());
        return new UpdateProfileResponse(user.getId(), user.getName(), user.getEmail());
    }

    public String getWidgetConfig(Long userId) {
        return findUser(userId).getWidgetConfig();
    }

    @Transactional
    public void saveWidgetConfig(Long userId, String config) {
        findUser(userId).updateWidgetConfig(config);
    }

    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = findUser(userId);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "INVALID_CURRENT_PASSWORD", "현재 비밀번호가 올바르지 않습니다.");
        }
        if (request.currentPassword().equals(request.newPassword())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "SAME_PASSWORD", "새 비밀번호가 현재 비밀번호와 동일합니다.");
        }
        user.updatePassword(passwordEncoder.encode(request.newPassword()));
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new ApiException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));
    }
}
