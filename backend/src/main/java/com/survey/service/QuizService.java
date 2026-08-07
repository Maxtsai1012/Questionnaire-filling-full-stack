package com.survey.service;

import com.survey.common.ResourceNotFoundException;
import com.survey.dto.*;
import com.survey.entity.Quiz;
import com.survey.enums.QuizStatus;
import com.survey.repository.QuizRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final QuizManagementService quizManagementService;

    @Transactional(readOnly = true)
    public Page<QuizListDto> getFrontQuizzes(String name, LocalDate startDate, LocalDate endDate, int page, int size) {
        quizManagementService.validateDateRange(startDate, endDate);
        Pageable pageable = PageRequest.of(page, size);
        Page<Quiz> quizzes = quizRepository.searchPublishedQuizzes(name, startDate, endDate, pageable);

        return quizzes.map(quiz -> {
            QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
            boolean canFill = (status == QuizStatus.IN_PROGRESS);
            boolean canViewStats = (status == QuizStatus.IN_PROGRESS || status == QuizStatus.ENDED);

            return QuizListDto.builder()
                    .id(quiz.getId())
                    .name(quiz.getName())
                    .startDate(quiz.getStartDate())
                    .endDate(quiz.getEndDate())
                    .isPublished(quiz.getIsPublished())
                    .status(status)
                    .statusLabel(status.getLabel())
                    .canFill(canFill)
                    .canViewStats(canViewStats)
                    .build();
        });
    }

    @Transactional(readOnly = true)
    public QuizDetailDto getFrontQuizDetail(Integer id) {
        Quiz quiz = quizRepository.findByIdAndIsPublishedTrue(id)
                .orElseThrow(() -> new ResourceNotFoundException("問卷不存在"));

        QuizStatus status = QuizStatus.computeStatus(quiz.getIsPublished(), quiz.getStartDate(), quiz.getEndDate());
        List<QuestionSaveDto> questionDtos = quizManagementService.loadQuestions(id);

        return QuizDetailDto.builder()
                .id(quiz.getId())
                .name(quiz.getName())
                .description(quiz.getDescription())
                .startDate(quiz.getStartDate())
                .endDate(quiz.getEndDate())
                .isPublished(quiz.getIsPublished())
                .status(status)
                .statusLabel(status.getLabel())
                .questions(questionDtos)
                .build();
    }
}
