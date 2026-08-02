package com.survey.enums;

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
}
