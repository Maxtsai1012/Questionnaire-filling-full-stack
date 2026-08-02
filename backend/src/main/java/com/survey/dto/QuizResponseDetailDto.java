package com.survey.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
public class QuizResponseDetailDto {
    private Integer responseId;
    private Integer quizId;
    private String quizName;
    private String quizDescription;
    private LocalDate startDate;
    private LocalDate endDate;

    private String respondentName;
    private String phone;
    private String email;
    private Integer age;
    private LocalDateTime submittedAt;

    private List<QuestionAnswerItemDto> answers;

    @Getter
    @Setter
    @Builder
    public static class QuestionAnswerItemDto {
        private Integer questionId;
        private String title;
        private String type; // Q, M, T
        private Boolean isRequired;
        private String answer;
    }
}
