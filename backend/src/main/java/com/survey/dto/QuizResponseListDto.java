package com.survey.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@Builder
public class QuizResponseListDto {
    private Integer id;
    private String respondentName;
    private LocalDateTime submittedAt;
}
