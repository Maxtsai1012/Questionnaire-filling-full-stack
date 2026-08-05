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
import com.survey.security.UserPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

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
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("問卷結束的時間不能比開始的時間還要早，請重新選擇時間!!");
        }
        return ApiResponse.ok(adminQuizService.getAdminQuizzes(name, startDate, endDate, page, size));
    }

    @PostMapping
    public ApiResponse<Integer> createOrUpdateQuiz(@AuthenticationPrincipal UserPrincipal principal,
                                                   @Valid @RequestBody QuizSaveRequestDto req) {
        Integer id = adminQuizService.saveOrUpdateQuiz(req, principal.getUser(), true);
        String msg = Boolean.TRUE.equals(req.getIsPublished()) ? "問卷發佈成功！" : "問卷草稿儲存成功！";
        return ApiResponse.ok(msg, id);
    }

    @GetMapping("/{id}")
    public ApiResponse<QuizDetailDto> getManagedQuiz(@AuthenticationPrincipal UserPrincipal principal,
                                                     @PathVariable Integer id) {
        return ApiResponse.ok(adminQuizService.getManagedQuizDetail(id, principal.getUserId(), true));
    }

    @PostMapping("/delete")
    public ApiResponse<Void> deleteQuizzes(@RequestBody List<Integer> ids) {
        adminQuizService.deleteQuizzes(ids);
        return ApiResponse.ok("問卷刪除成功！", null);
    }

    @GetMapping("/{id}/responses")
    public ApiResponse<Page<QuizResponseListDto>> getQuizResponses(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable Integer id,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        return ApiResponse.ok(adminQuizService.getQuizResponses(id, page, size, principal.getUserId(), true));
    }

    @GetMapping("/response/{responseId}")
    public ApiResponse<QuizResponseDetailDto> getResponseDetail(@AuthenticationPrincipal UserPrincipal principal,
                                                                 @PathVariable Integer responseId) {
        return ApiResponse.ok(adminQuizService.getResponseDetail(responseId, principal.getUserId(), true));
    }

    @GetMapping("/{id}/statistics")
    public ApiResponse<QuizStatisticsDto> getAdminStatistics(@PathVariable Integer id) {
        return ApiResponse.ok(statisticsService.getQuizStatistics(id));
    }
}
