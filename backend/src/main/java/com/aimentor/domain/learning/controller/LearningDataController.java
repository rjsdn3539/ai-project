package com.aimentor.domain.learning.controller;

import com.aimentor.common.api.ApiResponse;
import com.aimentor.common.security.AuthenticatedUser;
import com.aimentor.domain.learning.dto.request.CreateInterviewBookmarkRequest;
import com.aimentor.domain.learning.dto.request.CreateWrongNoteRequest;
import com.aimentor.domain.learning.dto.request.SubmitLearningSessionResultRequest;
import com.aimentor.domain.learning.dto.request.UpdateLearningPreferencesRequest;
import com.aimentor.domain.learning.dto.request.UpsertAchievementStateRequest;
import com.aimentor.domain.learning.dto.request.UpsertLearningProgressRequest;
import com.aimentor.domain.learning.dto.response.AchievementStateResponse;
import com.aimentor.domain.learning.dto.response.InterviewBookmarkResponse;
import com.aimentor.domain.learning.dto.response.LearningOverviewResponse;
import com.aimentor.domain.learning.dto.response.LearningProgressResponse;
import com.aimentor.domain.learning.dto.response.WrongNoteResponse;
import com.aimentor.domain.learning.service.LearningDataService;
import jakarta.validation.Valid;
import java.util.List;
import java.util.Map;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/learning")
public class LearningDataController {

    private final LearningDataService learningDataService;

    public LearningDataController(LearningDataService learningDataService) {
        this.learningDataService = learningDataService;
    }

    @GetMapping("/overview")
    public ApiResponse<LearningOverviewResponse> getOverview(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(learningDataService.getLearningOverview(authenticatedUser.userId()));
    }

    @GetMapping("/dashboard-summary")
    public ApiResponse<Map<String, Object>> getDashboardSummary(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(learningDataService.getDashboardSummary(authenticatedUser.userId()));
    }

    @GetMapping("/progress")
    public ApiResponse<List<LearningProgressResponse>> listProgresses(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(learningDataService.listLearningProgresses(authenticatedUser.userId()));
    }

    @GetMapping("/progress/detail")
    public ApiResponse<LearningProgressResponse> getProgress(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam String subject,
            @RequestParam String difficulty
    ) {
        return ApiResponse.success(learningDataService.getLearningProgress(authenticatedUser.userId(), subject, difficulty));
    }

    @PutMapping("/progress")
    public ApiResponse<LearningProgressResponse> upsertProgress(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody UpsertLearningProgressRequest request
    ) {
        return ApiResponse.success(learningDataService.upsertLearningProgress(authenticatedUser.userId(), request));
    }

    @DeleteMapping("/progress")
    public ApiResponse<Void> deleteProgress(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestParam String subject,
            @RequestParam String difficulty
    ) {
        learningDataService.deleteLearningProgress(authenticatedUser.userId(), subject, difficulty);
        return ApiResponse.success();
    }

    @PutMapping("/preferences")
    public ApiResponse<LearningOverviewResponse> updatePreferences(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @RequestBody UpdateLearningPreferencesRequest request
    ) {
        return ApiResponse.success(learningDataService.updateLearningPreferences(authenticatedUser.userId(), request));
    }

    @PostMapping("/session-results")
    public ApiResponse<LearningOverviewResponse> submitSessionResult(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody SubmitLearningSessionResultRequest request
    ) {
        return ApiResponse.success(learningDataService.submitSessionResult(authenticatedUser.userId(), request));
    }

    @GetMapping("/wrong-notes")
    public ApiResponse<List<WrongNoteResponse>> listWrongNotes(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(learningDataService.listWrongNotes(authenticatedUser.userId()));
    }

    @PostMapping("/wrong-notes")
    public ApiResponse<WrongNoteResponse> createWrongNote(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateWrongNoteRequest request
    ) {
        return ApiResponse.success(learningDataService.createWrongNote(authenticatedUser.userId(), request));
    }

    @DeleteMapping("/wrong-notes/{noteId}")
    public ApiResponse<Void> deleteWrongNote(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable Long noteId
    ) {
        learningDataService.deleteWrongNote(authenticatedUser.userId(), noteId);
        return ApiResponse.success();
    }

    @DeleteMapping("/wrong-notes")
    public ApiResponse<Void> clearWrongNotes(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        learningDataService.clearWrongNotes(authenticatedUser.userId());
        return ApiResponse.success();
    }

    @GetMapping("/achievement-state")
    public ApiResponse<AchievementStateResponse> getAchievementState(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser
    ) {
        return ApiResponse.success(learningDataService.getAchievementState(authenticatedUser.userId()));
    }

    @PutMapping("/achievement-state")
    public ApiResponse<AchievementStateResponse> updateAchievementState(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody UpsertAchievementStateRequest request
    ) {
        return ApiResponse.success(learningDataService.updateAchievementState(authenticatedUser.userId(), request));
    }

    @PostMapping("/bookmarks")
    public ApiResponse<InterviewBookmarkResponse> createBookmark(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @Valid @RequestBody CreateInterviewBookmarkRequest request
    ) {
        return ApiResponse.success(learningDataService.createInterviewBookmark(authenticatedUser.userId(), request));
    }

    @DeleteMapping("/bookmarks/{bookmarkKey}")
    public ApiResponse<Void> deleteBookmark(
            @AuthenticationPrincipal AuthenticatedUser authenticatedUser,
            @PathVariable String bookmarkKey
    ) {
        learningDataService.deleteInterviewBookmark(authenticatedUser.userId(), bookmarkKey);
        return ApiResponse.success();
    }
}
