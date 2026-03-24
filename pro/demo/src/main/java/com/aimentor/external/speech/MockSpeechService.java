package com.aimentor.external.speech;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

/**
 * Whisper STT Mock 구현체 (AI 서버 없이 테스트)
 * application.yml: ai.service.mock=true 일 때 활성화
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "ai.service.mock", havingValue = "true", matchIfMissing = true)
public class MockSpeechService implements SpeechService {

    @Override
    public String speechToText(MultipartFile audioFile) {
        log.info("[MockSTT] Received audio: {} ({}bytes)",
                audioFile.getOriginalFilename(), audioFile.getSize());
        return "저는 백엔드 개발자로서 3년간 Spring Boot를 사용한 경험이 있습니다.";
    }
}
