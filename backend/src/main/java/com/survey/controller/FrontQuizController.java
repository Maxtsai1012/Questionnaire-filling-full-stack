package com.survey.controller;

import com.survey.dto.*;
import com.survey.service.QuizService;
import com.survey.service.StatisticsService;
import com.survey.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

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
        if (startDate != null && endDate != null && endDate.isBefore(startDate)) {
            throw new IllegalArgumentException("問卷結束的時間不能比開始的時間還要早，請重新選擇時間!!");
        }
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
    public ApiResponse<Integer> submitResponse(@PathVariable Integer id,
                                               @AuthenticationPrincipal UserPrincipal principal,
                                               @Valid @RequestBody ResponseSubmitDto req) {
        req.setQuizId(id);
        var user = principal == null ? null : principal.getUser();
        if (user != null) {
            req.setRespondentName(user.getName()); req.setPhone(user.getPhone()); req.setEmail(user.getEmail());
        }
        return ApiResponse.ok("問卷提交成功！", quizService.submitResponse(req, user == null ? null : user.getId()));
    }

    @GetMapping("/{id}/statistics")
    public ApiResponse<QuizStatisticsDto> getStatistics(@PathVariable Integer id) {
        return ApiResponse.ok(statisticsService.getPublicQuizStatistics(id));
    }
}
