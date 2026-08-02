package com.survey.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class QuestionSaveDto {
    private Integer questId;
    private String questName;
    private String type; // Q, M, T
    private Boolean need; // isRequired
    private List<OptionDto> options;
}
