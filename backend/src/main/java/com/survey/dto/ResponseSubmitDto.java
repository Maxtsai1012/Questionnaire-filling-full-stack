package com.survey.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Min;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class ResponseSubmitDto {
    private Integer quizId;

    @NotBlank(message = "姓名不能為空")
    @Pattern(regexp = "^[\\p{IsHan}A-Za-z]+(?:[ ]+[\\p{IsHan}A-Za-z]+)*$", message = "只允許填寫中文和英文!!")
    private String respondentName;

    @NotBlank(message = "手機不能為空")
    @Pattern(regexp = "^09\\d{8}$", message = "手機格式不符!!")
    private String phone;

    @NotBlank(message = "Email 不能為空")
    @Email(message = "信箱格式不符!!")
    private String email;

    @Min(value = 0, message = "年齡不得為負數!!")
    private Integer age;

    private List<AnswerSubmitDto> answers;

    public void setRespondentName(String respondentName) {
        this.respondentName = respondentName == null ? null : respondentName.trim().replaceAll("\\s+", " ");
    }

    public void setPhone(String phone) {
        this.phone = phone == null ? null : phone.replaceAll("[\\s-]", "");
    }

    /** 一律存小寫，讓 uk_quiz_email 這個唯一鍵不必依賴 collation 是否分大小寫。 */
    public void setEmail(String email) {
        this.email = email == null ? null : email.trim().toLowerCase(java.util.Locale.ROOT);
    }
}
