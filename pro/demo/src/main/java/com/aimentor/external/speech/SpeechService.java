package com.aimentor.external.speech;

import org.springframework.web.multipart.MultipartFile;

/**
 * 음성→텍스트 변환 인터페이스
 * 구현체: PythonSpeechService (실제), MockSpeechService (테스트용)
 * TTS는 프론트엔드에서 브라우저 SpeechSynthesis API로 처리하므로 백엔드 불필요
 */
public interface SpeechService {
    /**
     * 음성 파일을 텍스트로 변환
     * @param audioFile webm, wav, mp3, mp4, m4a 형식
     * @return 변환된 텍스트
     */
    String speechToText(MultipartFile audioFile);
}
