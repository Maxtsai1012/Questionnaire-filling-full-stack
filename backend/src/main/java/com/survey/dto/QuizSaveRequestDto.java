package com.survey.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class QuizSaveRequestDto {
    private Integer id;

    @NotBlank(message = "問卷名稱不能為空！")
    private String name;

    @NotBlank(message = "問卷說明不能為空！")
    private String description;

    @NotNull(message = "開始時間不能為空！")
    private LocalDate startDate;

    @NotNull(message = "結束時間不能為空！")
    private LocalDate endDate;

    private Boolean isPublished = false;

    private List<@Valid QuestionSaveDto> questions;
}
