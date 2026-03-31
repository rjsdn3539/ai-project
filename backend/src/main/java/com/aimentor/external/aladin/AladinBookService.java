package com.aimentor.external.aladin;

import com.aimentor.common.exception.ApiException;
import com.aimentor.domain.book.dto.response.AladinBookItemResponse;
import com.aimentor.domain.book.dto.response.AladinItemListResponse;
import com.aimentor.external.aladin.dto.AladinItemListApiResponse;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

@Service
public class AladinBookService {

    private static final Logger log = LoggerFactory.getLogger(AladinBookService.class);
    private static final String DEFAULT_QUERY = "개발";
    private static final String DEFAULT_SEARCH_TARGET = "Book";
    private static final String DEFAULT_CATEGORY_ID = "27660";
    private static final String OUTPUT = "js";
    private static final String VERSION = "20131101";
    private static final int DEFAULT_MAX_RESULTS = 12;
    private static final int DEFAULT_START = 1;
    private static final int MAX_ALLOWED_RESULTS = 50;
    private static final Set<String> ALLOWED_SEARCH_TARGETS = Set.of("Book");

    private final AladinProperties properties;
    private final ObjectMapper objectMapper;
    private final HttpClient httpClient;

    public AladinBookService(AladinProperties properties, ObjectMapper objectMapper) {
        this.properties = properties;
        this.objectMapper = objectMapper;
        this.httpClient = HttpClient.newBuilder()
                .version(HttpClient.Version.HTTP_1_1)
                .build();
    }

    public AladinItemListResponse getItEditorChoiceBooks() {
        return searchBooks(DEFAULT_QUERY, DEFAULT_SEARCH_TARGET, DEFAULT_CATEGORY_ID, DEFAULT_MAX_RESULTS, DEFAULT_START);
    }

    public AladinItemListResponse searchBooks(String query, String searchTarget, String categoryId, int maxResults, int start) {
        validateConfiguration();
        validateRequest(query, searchTarget, categoryId, maxResults, start);
        String requestUrl = buildItemSearchUrl(query, searchTarget, categoryId, maxResults, start);

        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(requestUrl))
                    .GET()
                    .build();

            HttpResponse<String> response = httpClient.send(
                    request,
                    HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8)
            );

            if (response.statusCode() != 200) {
                log.error("Aladin ItemSearch call failed. status={}, body={}", response.statusCode(), response.body());
                throw new ApiException(HttpStatus.BAD_GATEWAY, "ALADIN_API_ERROR", "Failed to search books from Aladin");
            }

            AladinItemListApiResponse apiResponse = objectMapper.readValue(response.body(), AladinItemListApiResponse.class);
            List<AladinBookItemResponse> items = apiResponse.item() == null
                    ? List.of()
                    : apiResponse.item().stream()
                    .map(item -> new AladinBookItemResponse(
                            item.itemId(),
                            item.isbn(),
                            item.isbn13(),
                            item.title(),
                            item.author(),
                            item.publisher(),
                            item.pubDate(),
                            item.customerReviewRank(),
                            item.priceSales(),
                            item.priceStandard(),
                            item.cover(),
                            item.categoryName(),
                            item.description(),
                            item.link()
                    ))
                    .toList();

            int totalResults = apiResponse.totalResults() != null ? apiResponse.totalResults() : items.size();
            return new AladinItemListResponse(totalResults, items);
        } catch (ApiException e) {
            throw e;
        } catch (Exception e) {
            log.error("Aladin ItemSearch request failed: {}", e.getMessage(), e);
            throw new ApiException(HttpStatus.BAD_GATEWAY, "ALADIN_API_ERROR", "Failed to search books from Aladin");
        }
    }

    private void validateConfiguration() {
        if (properties.ttbKey() == null || properties.ttbKey().isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ALADIN_KEY_MISSING", "Aladin API key is missing");
        }
        if (properties.baseUrl() == null || properties.baseUrl().isBlank()) {
            throw new ApiException(HttpStatus.INTERNAL_SERVER_ERROR, "ALADIN_BASE_URL_MISSING", "Aladin base URL is missing");
        }
    }

    private void validateRequest(String query, String searchTarget, String categoryId, int maxResults, int start) {
        if (query == null || query.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALADIN_QUERY_REQUIRED", "Query is required");
        }
        if (searchTarget == null || searchTarget.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALADIN_SEARCH_TARGET_REQUIRED", "Search target is required");
        }
        if (!ALLOWED_SEARCH_TARGETS.contains(searchTarget)) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALADIN_SEARCH_TARGET_INVALID", "Unsupported Aladin search target");
        }
        if (categoryId == null || categoryId.isBlank()) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALADIN_CATEGORY_ID_REQUIRED", "Category id is required");
        }
        if (maxResults < 1 || maxResults > MAX_ALLOWED_RESULTS) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALADIN_MAX_RESULTS_INVALID", "Max results must be between 1 and 50");
        }
        if (start < 1) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "ALADIN_START_INVALID", "Start must be at least 1");
        }
    }

    private String buildItemSearchUrl(String query, String searchTarget, String categoryId, int maxResults, int start) {
        return properties.baseUrl()
                + "/ItemSearch.aspx"
                + "?ttbkey=" + encode(properties.ttbKey())
                + "&Query=" + encode(query)
                + "&SearchTarget=" + encode(searchTarget)
                + "&CategoryId=" + encode(categoryId)
                + "&MaxResults=" + maxResults
                + "&start=" + start
                + "&output=" + encode(OUTPUT)
                + "&Version=" + encode(VERSION);
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
