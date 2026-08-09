package com.survey.controller;

import com.survey.dto.*;
import com.survey.security.UserPrincipal;
import com.survey.service.QuizResponseService;
import com.survey.service.QuizService;
import com.survey.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class FrontQuizController {

    private final QuizService quizService;
    private final QuizResponseService quizResponseService;
    private final StatisticsService statisticsService;

    @GetMapping
    public ApiResponse<Page<QuizListDto>> getQuizzes(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "id") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDirection) {
        return ApiResponse.ok(quizService.getFrontQuizzes(
                name, startDate, endDate, page, size, sortBy, sortDirection));
    }

    @GetMapping("/{id}")
    public ApiResponse<QuizDetailDto> getQuizDetail(@PathVariable Integer id) {
        return ApiResponse.ok(quizService.getFrontQuizDetail(id));
    }

    @PostMapping("/{id}/response")
    public ApiResponse<Integer> submitResponse(@PathVariable Integer id,
                                               @AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody ResponseSubmitDto req) {
        req.setQuizId(id);
        var user = principal == null ? null : principal.getUser();
        if (user != null) {
            req.setRespondentName(user.getName());
            req.setPhone(user.getPhone());
            req.setEmail(user.getEmail());
        }
        return ApiResponse.ok("問卷提交成功！",
                quizResponseService.submitResponse(req, user));
    }

    @GetMapping("/{id}/statistics")
    public ApiResponse<QuizStatisticsDto> getStatistics(@PathVariable Integer id) {
        return ApiResponse.ok(statisticsService.getPublicQuizStatistics(id));
    }
}
