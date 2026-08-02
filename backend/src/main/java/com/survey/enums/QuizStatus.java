package com.survey.enums;

import java.time.LocalDate;

public enum QuizStatus {
    UNPUBLISHED("未發佈"),
    NOT_STARTED("尚未開始"),
    IN_PROGRESS("開放中"),
    ENDED("已關閉");

    private final String label;

    QuizStatus(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public static QuizStatus computeStatus(Boolean isPublished, LocalDate startDate, LocalDate endDate) {
        if (Boolean.FALSE.equals(isPublished)) {
            return UNPUBLISHED;
        }
        LocalDate today = LocalDate.now();
        if (today.isBefore(startDate)) {
            return NOT_STARTED;
        } else if (!today.isBefore(startDate) && !today.isAfter(endDate)) {
            return IN_PROGRESS;
        } else {
            return ENDED;
        }
    }
}
