package com.aimentor.external.speech;

import com.aimentor.common.exception.AiServiceException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;

import java.io.IOException;
import java.util.Map;

/**
 * Python FastAPI 서버의 /stt 엔드포인트를 호출하는 실제 구현체
 */
@Slf4j
@Service
@ConditionalOnProperty(name = "ai.service.mock", havingValue = "false")
@RequiredArgsConstructor
public class PythonSpeechService implements SpeechService {

    private final WebClient webClient;

    @Value("${ai.server.url}")
    private String aiServerUrl;

    @Override
    public String speechToText(MultipartFile audioFile) {
        try {
            byte[] bytes = audioFile.getBytes();
            ByteArrayResource resource = new ByteArrayResource(bytes) {
                @Override
                public String getFilename() {
                    return audioFile.getOriginalFilename();
                }
            };

            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("audio", resource);

            Map<?, ?> resp = webClient.post()
                    .uri(aiServerUrl + "/stt")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(body))
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();

            return resp != null ? (String) resp.get("text") : "";

        } catch (IOException e) {
            throw new AiServiceException("음성 파일 처리 중 오류가 발생했습니다.");
        } catch (Exception e) {
            log.error("STT 서버 호출 실패: {}", e.getMessage());
            throw new AiServiceException("음성 변환에 실패했습니다.");
        }
    }
}
