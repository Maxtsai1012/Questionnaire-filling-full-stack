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
public class QuestionStatDto {
    private Integer questionId;
    private String title;
    private String type; // Q, M, T
    private Boolean isRequired;
    private Integer totalAnswers;
    private List<OptionStatDto> options;
    private List<TextAnswerDto> textAnswers;
}
