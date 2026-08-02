package com.survey.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class QuizStatisticsDto {
    private Integer quizId;
    private String quizName;
    private String description;
    private Integer totalResponses;
    private List<QuestionStatDto> questions;
}
