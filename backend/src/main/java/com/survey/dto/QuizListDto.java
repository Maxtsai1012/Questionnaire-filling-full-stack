package com.survey.dto;

import com.survey.enums.QuizStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
public class QuizListDto {
    private Integer id;
    private String name;
    private LocalDate startDate;
    private LocalDate endDate;
    private Boolean isPublished;
    private QuizStatus adminStatusOverride;
    private QuizStatus status;
    private String statusLabel;
    private Boolean canEdit;
    private Boolean canViewStats;
    private Boolean canFill;
    private Integer ownerId;
    private String ownerName;
    private Long responseCount;
}
