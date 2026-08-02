package com.survey.controller;

import com.survey.dto.*;
import com.survey.service.QuizService;
import com.survey.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/quiz")
@RequiredArgsConstructor
public class FrontQuizController {

    private final QuizService quizService;
    private final StatisticsService statisticsService;

    @GetMapping
    public ApiResponse<Page<QuizListDto>> getQuizzes(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(quizService.getFrontQuizzes(name, startDate, endDate, page, size));
    }

    @GetMapping("/{id}")
    public ApiResponse<QuizDetailDto> getQuizDetail(@PathVariable Integer id) {
        return ApiResponse.ok(quizService.getFrontQuizDetail(id));
    }

    @GetMapping("/{id}/check-email")
    public ApiResponse<Boolean> checkEmailExists(@PathVariable Integer id, @RequestParam String email) {
        return ApiResponse.ok(quizService.checkEmailExists(id, email));
    }

    @PostMapping("/{id}/response")
    public ApiResponse<Integer> submitResponse(@PathVariable Integer id, @Valid @RequestBody ResponseSubmitDto req) {
        req.setQuizId(id);
        return ApiResponse.ok("問卷提交成功！", quizService.submitResponse(req));
    }

    @GetMapping("/{id}/statistics")
    public ApiResponse<QuizStatisticsDto> getStatistics(@PathVariable Integer id) {
        return ApiResponse.ok(statisticsService.getQuizStatistics(id));
    }
}
