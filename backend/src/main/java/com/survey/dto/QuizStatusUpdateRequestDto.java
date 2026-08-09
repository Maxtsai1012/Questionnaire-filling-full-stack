package com.survey.dto;

import com.survey.enums.QuizStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class QuizStatusUpdateRequestDto {
    @NotNull(message = "請選擇問卷狀態")
    private QuizStatus status;
}
