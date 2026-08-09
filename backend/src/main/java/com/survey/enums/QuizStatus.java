package com.survey.enums;

import java.time.LocalDate;

public enum QuizStatus {
    UNPUBLISHED("未發佈"),
    NOT_STARTED("尚未開始"),
    IN_PROGRESS("進行中"),
    ENDED("已結束");

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

    /**
     * ADMIN 手動狀態優先；未設定時才依發布旗標與日期推算。
     * 所有列表、明細、填答與編輯鎖定都必須走這個入口。
     */
    public static QuizStatus effectiveStatus(QuizStatus adminOverride,
                                             Boolean isPublished,
                                             LocalDate startDate,
                                             LocalDate endDate) {
        return adminOverride != null
                ? adminOverride
                : computeStatus(isPublished, startDate, endDate);
    }
}
