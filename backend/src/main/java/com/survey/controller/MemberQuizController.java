package com.survey.controller;

import com.survey.dto.ApiResponse;
import com.survey.dto.QuizDetailDto;
import com.survey.dto.QuizListDto;
import com.survey.dto.QuizResponseDetailDto;
import com.survey.dto.QuizResponseListDto;
import com.survey.dto.QuizSaveRequestDto;
import com.survey.dto.QuizStatisticsDto;
import com.survey.security.UserPrincipal;
import com.survey.service.QuizManagementService;
import com.survey.service.QuizResponseService;
import com.survey.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/** 會員端點；admin=false 讓服務層對每個問卷強制檢查 owner。 */
@RestController
@RequestMapping("/api/member/quiz")
@RequiredArgsConstructor
public class MemberQuizController {

    private static final boolean AS_ADMIN = false;

    private final QuizManagementService quizManagementService;
    private final QuizResponseService quizResponseService;
    private final StatisticsService statisticsService;

    @GetMapping
    public ApiResponse<Page<QuizListDto>> mine(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(quizManagementService.getOwnedQuizzes(
                principal.getUserId(), name, startDate, endDate, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<QuizDetailDto> detail(@AuthenticationPrincipal UserPrincipal principal,
                                             @PathVariable Integer id) {
        return ApiResponse.ok(quizManagementService.getManagedQuizDetail(id, principal.getUserId(), AS_ADMIN));
    }

    @PostMapping
    public ApiResponse<Integer> save(@AuthenticationPrincipal UserPrincipal principal,
                                     @Valid @RequestBody QuizSaveRequestDto req) {
        return ApiResponse.ok("問卷儲存成功",
                quizManagementService.saveOrUpdateQuiz(req, principal.getUser(), AS_ADMIN));
    }

    @PostMapping("/delete")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                    @RequestBody List<Integer> ids) {
        quizManagementService.deleteQuizzes(ids, principal.getUserId(), AS_ADMIN);
        return ApiResponse.ok("問卷刪除成功", null);
    }

    @GetMapping("/{id}/responses")
    public ApiResponse<Page<QuizResponseListDto>> responses(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(quizResponseService.getQuizResponses(id, page, size, principal.getUserId(), AS_ADMIN));
    }

    @GetMapping("/response/{responseId}")
    public ApiResponse<QuizResponseDetailDto> responseDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer responseId) {
        return ApiResponse.ok(quizResponseService.getResponseDetail(responseId, principal.getUserId(), AS_ADMIN));
    }

    @GetMapping("/{id}/statistics")
    public ApiResponse<QuizStatisticsDto> statistics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        return ApiResponse.ok(statisticsService.getManagedQuizStatistics(id, principal.getUserId(), AS_ADMIN));
    }
}
