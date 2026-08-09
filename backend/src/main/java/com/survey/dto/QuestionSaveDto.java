package com.survey.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
    @NotBlank(message = "題目名稱不能為空！")
    private String questName;
    @NotBlank(message = "題型不能為空！")
    private String type; // Q, M, T
    @NotNull(message = "請設定題目是否必填！")
    private Boolean need; // isRequired
    private List<OptionDto> options;
}
