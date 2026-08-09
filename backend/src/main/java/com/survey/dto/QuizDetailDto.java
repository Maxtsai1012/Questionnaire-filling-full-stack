package com.survey.dto;

import com.survey.enums.QuizStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
public class QuizDetailDto {
    private Integer id;
    private String name;
    private String description;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isPublished;
    private QuizStatus adminStatusOverride;
    private QuizStatus status;
    private String statusLabel;
    private List<QuestionSaveDto> questions;
}
