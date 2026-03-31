package com.aimentor.common.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

/**
 * JWT 토큰 생성 / 파싱 / 검증 담당
 * - accessToken: 30분
 * - refreshToken: 7일
 */
@Slf4j
@Component
public class JwtProvider {

    private static final long ACCESS_TOKEN_MS  = 30 * 60 * 1000L;       // 30분
    private static final long REFRESH_TOKEN_MS = 7 * 24 * 60 * 60 * 1000L; // 7일

    private final SecretKey key;

    public JwtProvider(@Value("${jwt.secret}") String secret) {
        this.key = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    /** accessToken 생성 */
    public String generateAccessToken(Long userId, String role) {
        return buildToken(userId, role, ACCESS_TOKEN_MS);
    }

    /** refreshToken 생성 */
    public String generateRefreshToken(Long userId, String role) {
        return buildToken(userId, role, REFRESH_TOKEN_MS);
    }

    private String buildToken(Long userId, String role, long expireMs) {
        Date now = new Date();
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("role", role)
                .issuedAt(now)
                .expiration(new Date(now.getTime() + expireMs))
                .signWith(key)
                .compact();
    }

    /** 토큰에서 userId 추출 */
    public Long getUserId(String token) {
        return Long.valueOf(getClaims(token).getSubject());
    }

    /** 토큰에서 role 추출 */
    public String getRole(String token) {
        return getClaims(token).get("role", String.class);
    }

    /** 토큰 유효성 검증 */
    public boolean validate(String token) {
        try {
            getClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            log.warn("Invalid JWT: {}", e.getMessage());
            return false;
        }
    }

    private Claims getClaims(String token) {
        return Jwts.parser()
                .verifyWith(key)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
