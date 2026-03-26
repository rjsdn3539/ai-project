package com.aimentor.external.address;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.order.dto.response.JusoAddressItemResponse;
import com.aimentor.domain.order.dto.response.JusoAddressSearchResponse;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class JusoAddressService {

    private static final Logger log = LoggerFactory.getLogger(JusoAddressService.class);
    private static final int REQUEST_TIMEOUT_SECONDS = 10;

    private final JusoProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public JusoAddressService(JusoProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
                .version(HttpClient.Version.HTTP_1_1)
                .build();
    }

    public JusoAddressSearchResponse search(String keyword, int currentPage, int countPerPage) {
        validateConfiguration();
        validateRequest(keyword, currentPage, countPerPage);
        String requestUrl = buildRequestUrl(keyword, currentPage, countPerPage);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(requestUrl))
                    .timeout(Duration.ofSeconds(REQUEST_TIMEOUT_SECONDS))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            if (response.statusCode() != 200) {
                log.error("Juso API call failed. status={}, body={}", response.statusCode(), response.body());
                throw new ApiException(HttpStatus.BAD_GATEWAY, "JUSO_API_ERROR", "주소 검색 서비스 호출에 실패했습니다.");
            }

            JsonNode payload = objectMapper.readTree(response.body());
            JsonNode common = payload.path("results").path("common");
            String errorCode = common.path("errorCode").asText("0");
            String errorMessage = common.path("errorMessage").asText("");

            if (!"0".equals(errorCode)) {
                log.error("Juso API returned error. code={}, message={}", errorCode, errorMessage);
                throw new ApiException(
                        HttpStatus.BAD_GATEWAY,
                        "JUSO_API_ERROR",
                        errorMessage.isBlank() ? "주소 검색 서비스 응답이 올바르지 않습니다." : errorMessage
                );
            }

            List<JusoAddressItemResponse> results = new ArrayList<>();
            JsonNode jusoList = payload.path("results").path("juso");
            if (jusoList.isArray()) {
                for (JsonNode item : jusoList) {
                    results.add(new JusoAddressItemResponse(
                            item.path("roadAddr").asText(""),
                            item.path("jibunAddr").asText(""),
                            item.path("zipNo").asText(""),
                            item.path("buildingName").asText(""),
                            item.path("bdMgtSn").asText("")
                    ));
                }
            }

            int totalCount = common.path("totalCount").asInt(results.size());
            return new JusoAddressSearchResponse(results, totalCount, currentPage, countPerPage);
        } catch (ApiException exception) {
            throw exception;
        } catch (Exception exception) {
            log.error("Juso address search failed: {}", exception.getMessage(), exception);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "JUSO_API_ERROR", "주소 검색 서비스 호출에 실패했습니다.");
        }
    }

    private void validateConfiguration() {
        if (properties.apiKey() == null || properties.apiKey().isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "JUSO_API_KEY_MISSING", "도로명주소 API 키가 설정되지 않았습니다.");
        }
        if (properties.baseUrl() == null || properties.baseUrl().isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "JUSO_API_BASE_URL_MISSING", "도로명주소 API 주소가 설정되지 않았습니다.");
        }
    }

    private void validateRequest(String keyword, int currentPage, int countPerPage) {
        if (keyword == null || keyword.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JUSO_KEYWORD_REQUIRED", "주소 검색어를 입력해주세요.");
        }
        if (keyword.trim().length() < 2) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JUSO_KEYWORD_TOO_SHORT", "주소 검색어를 2자 이상 입력해주세요.");
        }
        if (keyword.trim().length() > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JUSO_KEYWORD_TOO_LONG", "주소 검색어는 100자 이하로 입력해주세요.");
        }
        if (currentPage < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JUSO_PAGE_INVALID", "페이지 번호가 올바르지 않습니다.");
        }
        if (countPerPage < 1 || countPerPage > 100) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "JUSO_PAGE_SIZE_INVALID", "페이지 크기는 1 이상 100 이하만 가능합니다.");
        }
    }

    private String buildRequestUrl(String keyword, int currentPage, int countPerPage) {
        return properties.baseUrl()
                + "?confmKey=" + encode(properties.apiKey())
                + "&currentPage=" + currentPage
                + "&countPerPage=" + countPerPage
                + "&keyword=" + encode(keyword)
                + "&resultType=json";
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
