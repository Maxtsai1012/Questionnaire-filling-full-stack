package com.survey.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResponseSubmitDto {
    private Integer quizId;

    @NotBlank(message = "姓名不能為空")
    private String respondentName;

    @NotBlank(message = "手機不能為空")
    private String phone;

    @NotBlank(message = "Email 不能為空")
    @Email(message = "Email 格式不正確")
    private String email;

    private Integer age;

    private List<AnswerSubmitDto> answers;
}
