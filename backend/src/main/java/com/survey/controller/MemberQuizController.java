package com.survey.controller;

import com.survey.dto.ApiResponse;
import com.survey.dto.QuizSaveRequestDto;
import com.survey.security.UserPrincipal;
import com.survey.service.AdminQuizService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import java.time.LocalDate;
import java.util.List;
import com.survey.dto.QuizListDto;
import com.survey.dto.QuizDetailDto;
import com.survey.dto.QuizResponseDetailDto;
import com.survey.dto.QuizResponseListDto;
import com.survey.dto.QuizStatisticsDto;
import com.survey.service.StatisticsService;

@RestController @RequestMapping("/api/member/quiz") @RequiredArgsConstructor
public class MemberQuizController {
    private final AdminQuizService quizService;
    private final StatisticsService statisticsService;

    @GetMapping
    public ApiResponse<Page<QuizListDto>> mine(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(quizService.getOwnedQuizzes(
                principal.getUserId(), name, startDate, endDate, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<QuizDetailDto> detail(@AuthenticationPrincipal UserPrincipal principal,
                                             @PathVariable Integer id) {
        return ApiResponse.ok(quizService.getManagedQuizDetail(id, principal.getUserId(), false));
    }

    @PostMapping
    public ApiResponse<Integer> save(@AuthenticationPrincipal UserPrincipal principal,
                                       @Valid @RequestBody QuizSaveRequestDto req) {
        return ApiResponse.ok("問卷儲存成功", quizService.saveOrUpdateQuiz(req, principal.getUser(), false));
    }

    @PostMapping("/delete")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                    @RequestBody List<Integer> ids) {
        quizService.deleteQuizzes(ids, principal.getUserId(), false);
        return ApiResponse.ok("問卷刪除成功", null);
    }

    @GetMapping("/{id}/responses")
    public ApiResponse<Page<QuizResponseListDto>> responses(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(quizService.getQuizResponses(id, page, size, principal.getUserId(), false));
    }

    @GetMapping("/response/{responseId}")
    public ApiResponse<QuizResponseDetailDto> responseDetail(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer responseId) {
        return ApiResponse.ok(quizService.getResponseDetail(responseId, principal.getUserId(), false));
    }

    @GetMapping("/{id}/statistics")
    public ApiResponse<QuizStatisticsDto> statistics(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id) {
        return ApiResponse.ok(statisticsService.getManagedQuizStatistics(id, principal.getUserId(), false));
    }
}
