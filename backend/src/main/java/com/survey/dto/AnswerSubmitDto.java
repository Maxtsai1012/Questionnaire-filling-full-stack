package com.survey.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * 選擇題送 optionCodes、文字題送 answer。
 * 分號串接的舊格式已移除——選項文字含分號時它會直接解析錯亂。
 */
@Getter
@Setter
public class AnswerSubmitDto {

    private Integer questionId;

    /** 文字題答案。 */
    private String answer;

    /** 選擇題勾選的選項代碼；單選最多一個。 */
    private List<Integer> optionCodes;
}
