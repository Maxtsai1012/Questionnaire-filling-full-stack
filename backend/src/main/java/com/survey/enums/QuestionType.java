package com.survey.enums;

import java.util.Arrays;

public enum QuestionType {
    Q("單選"),
    M("多選"),
    T("文字");

    private final String label;

    QuestionType(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public String getCode() {
        return this.name();
    }

    public boolean isText() {
        return this == T;
    }

    public boolean isSingleChoice() {
        return this == Q;
    }

    public boolean isMultipleChoice() {
        return this == M;
    }

    public static QuestionType fromCode(String code) {
        if (code == null || code.isBlank()) {
            return null;
        }
        for (QuestionType type : values()) {
            if (type.name().equalsIgnoreCase(code.trim())) {
                return type;
            }
        }
        return null;
    }

    public static boolean isValidCode(String code) {
        return fromCode(code) != null;
    }
}
