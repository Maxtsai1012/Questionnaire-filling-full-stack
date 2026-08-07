package com.survey.common;

import lombok.Getter;
import java.util.Map;

@Getter
public class RequestValidationException extends RuntimeException {
    private final Map<String, String> fieldErrors;

    public RequestValidationException(Map<String, String> fieldErrors) {
        super("資料內容有誤，請您修改後再送出！");
        this.fieldErrors = fieldErrors;
    }
}
