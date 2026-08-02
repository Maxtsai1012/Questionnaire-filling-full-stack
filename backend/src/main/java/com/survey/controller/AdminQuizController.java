package com.survey.controller;

import com.survey.dto.*;
import com.survey.service.AdminQuizService;
import com.survey.service.StatisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/admin/quiz")
@RequiredArgsConstructor
public class AdminQuizController {

    private final AdminQuizService adminQuizService;
    private final StatisticsService statisticsService;

    @GetMapping
    public ApiResponse<Page<QuizListDto>> getAdminQuizzes(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(adminQuizService.getAdminQuizzes(name, startDate, endDate, page, size));
    }

    @PostMapping
    public ApiResponse<Integer> createOrUpdateQuiz(@Valid @RequestBody QuizSaveRequestDto req) {
        Integer id = adminQuizService.saveOrUpdateQuiz(req);
        String msg = Boolean.TRUE.equals(req.getIsPublished()) ? "問卷發佈成功！" : "問卷草稿儲存成功！";
        return ApiResponse.ok(msg, id);
    }

    @PostMapping("/delete")
    public ApiResponse<Void> deleteQuizzes(@RequestBody List<Integer> ids) {
        adminQuizService.deleteQuizzes(ids);
        return ApiResponse.ok("問卷刪除成功！", null);
    }

    @GetMapping("/{id}/responses")
    public ApiResponse<Page<QuizResponseListDto>> getQuizResponses(
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(adminQuizService.getQuizResponses(id, page, size));
    }

    @GetMapping("/response/{responseId}")
    public ApiResponse<QuizResponseDetailDto> getResponseDetail(@PathVariable Integer responseId) {
        return ApiResponse.ok(adminQuizService.getResponseDetail(responseId));
    }

    @GetMapping("/{id}/statistics")
    public ApiResponse<QuizStatisticsDto> getAdminStatistics(@PathVariable Integer id) {
        return ApiResponse.ok(statisticsService.getQuizStatistics(id));
    }
}
