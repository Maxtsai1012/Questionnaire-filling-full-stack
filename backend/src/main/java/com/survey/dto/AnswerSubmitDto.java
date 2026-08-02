package com.survey.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AnswerSubmitDto {
    private Integer questionId;
    private String answer; // text or optionName or semicolon separated for multi
}
