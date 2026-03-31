package com.aimentor.domain.user.service;

import com.aimentor.common.exception.ApiException;
import com.aimentor.common.security.jwt.JwtTokenClaims;
import com.aimentor.common.security.jwt.JwtTokenProvider;
import com.aimentor.common.security.jwt.JwtTokenType;
import com.aimentor.domain.user.dto.request.LoginRequest;
import com.aimentor.domain.user.dto.request.LogoutRequest;
import com.aimentor.domain.user.dto.request.RefreshTokenRequest;
import com.aimentor.domain.user.dto.request.SignupRequest;
import com.aimentor.domain.user.dto.response.AuthTokenResponse;
import com.aimentor.domain.user.entity.Role;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import java.time.LocalDateTime;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public AuthTokenResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.email())) {
            throw new ApiException(HttpStatus.CONFLICT, "EMAIL_ALREADY_EXISTS", "이미 가입된 이메일입니다.");
        }

        User user = User.builder()
                .email(request.email())
                .name(request.name())
                .password(passwordEncoder.encode(request.password()))
                .role(Role.USER)
                .build();

        User savedUser = userRepository.save(user);
        return issueTokens(savedUser);
    }

    @Transactional
    public AuthTokenResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_CREDENTIALS", "이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        return issueTokens(user);
    }

    @Transactional
    public AuthTokenResponse refresh(RefreshTokenRequest request) {
        JwtTokenClaims claims = jwtTokenProvider.parse(request.refreshToken());

        if (claims.tokenType() != JwtTokenType.REFRESH) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN_TYPE", "리프레시 토큰이 필요합니다.");
        }

        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        if (user.getRefreshToken() == null || !user.getRefreshToken().equals(request.refreshToken())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_MISMATCH", "저장된 리프레시 토큰과 일치하지 않습니다.");
        }

        if (user.getRefreshTokenExpiresAt() == null || user.getRefreshTokenExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "REFRESH_TOKEN_EXPIRED", "리프레시 토큰이 만료되었습니다.");
        }

        return issueTokens(user);
    }

    @Transactional
    public void logout(LogoutRequest request) {
        JwtTokenClaims claims = jwtTokenProvider.parse(request.refreshToken());

        if (claims.tokenType() != JwtTokenType.REFRESH) {
            throw new ApiException(HttpStatus.UNAUTHORIZED, "INVALID_TOKEN_TYPE", "리프레시 토큰이 필요합니다.");
        }

        User user = userRepository.findById(claims.userId())
                .orElseThrow(() -> new ApiException(HttpStatus.UNAUTHORIZED, "USER_NOT_FOUND", "사용자를 찾을 수 없습니다."));

        if (request.refreshToken().equals(user.getRefreshToken())) {
            user.clearRefreshToken();
        }
    }

    private AuthTokenResponse issueTokens(User user) {
        String accessToken = jwtTokenProvider.createAccessToken(user.getId(), user.getEmail(), user.getRole());
        String refreshToken = jwtTokenProvider.createRefreshToken(user.getId(), user.getEmail(), user.getRole());

        LocalDateTime accessTokenExpiresAt = LocalDateTime.now()
                .plusSeconds(jwtTokenProvider.getAccessTokenExpirationSeconds());
        LocalDateTime refreshTokenExpiresAt = LocalDateTime.now()
                .plusSeconds(jwtTokenProvider.getRefreshTokenExpirationSeconds());

        user.updateRefreshToken(refreshToken, refreshTokenExpiresAt);

        return new AuthTokenResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getEffectiveTier(),
                accessToken,
                accessTokenExpiresAt,
                refreshToken,
                refreshTokenExpiresAt
        );
    }
}
