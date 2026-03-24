package com.aimentor.domain.user.service;

import com.aimentor.common.exception.BusinessException;
import com.aimentor.common.security.JwtProvider;
import com.aimentor.domain.user.dto.*;
import com.aimentor.domain.user.entity.User;
import com.aimentor.domain.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.concurrent.ConcurrentHashMap;

/**
 * 회원가입, 로그인, 토큰 재발급, 로그아웃 처리
 * refreshToken은 인메모리 Map에 저장 (서버 재시작 시 초기화)
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtProvider jwtProvider;

    private static final ConcurrentHashMap<String, String> tokenStore = new ConcurrentHashMap<>();

    /** 회원가입 */
    @Transactional
    public void register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.getEmail())) {
            throw BusinessException.conflict("이미 사용 중인 이메일입니다.");
        }
        User user = User.builder()
                .name(req.getName())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .phone(req.getPhone())
                .build();
        userRepository.save(user);
    }

    /** 로그인 — accessToken + refreshToken 반환 */
    @Transactional
    public TokenResponse login(LoginRequest req) {
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> BusinessException.badRequest("이메일 또는 비밀번호가 올바르지 않습니다."));

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw BusinessException.badRequest("이메일 또는 비밀번호가 올바르지 않습니다.");
        }

        String role = user.getRole().name();
        String accessToken  = jwtProvider.generateAccessToken(user.getId(), role);
        String refreshToken = jwtProvider.generateRefreshToken(user.getId(), role);

        tokenStore.put("RT:" + user.getId(), refreshToken);

        return new TokenResponse(accessToken, refreshToken);
    }

    /** refreshToken으로 새 accessToken 발급 */
    @Transactional
    public TokenResponse refresh(String refreshToken) {
        if (!jwtProvider.validate(refreshToken)) {
            throw BusinessException.badRequest("유효하지 않은 refreshToken입니다.");
        }
        Long userId = jwtProvider.getUserId(refreshToken);
        String stored = tokenStore.get("RT:" + userId);

        if (!refreshToken.equals(stored)) {
            throw BusinessException.badRequest("refreshToken이 일치하지 않습니다.");
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));

        String role = user.getRole().name();
        String newAccess  = jwtProvider.generateAccessToken(userId, role);
        String newRefresh = jwtProvider.generateRefreshToken(userId, role);
        tokenStore.put("RT:" + userId, newRefresh);

        return new TokenResponse(newAccess, newRefresh);
    }

    /** 로그아웃 — 저장된 refreshToken 삭제 */
    @Transactional
    public void logout(Long userId) {
        tokenStore.remove("RT:" + userId);
    }

    /** 내 정보 조회 */
    public User getMe(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> BusinessException.notFound("사용자를 찾을 수 없습니다."));
    }
}
