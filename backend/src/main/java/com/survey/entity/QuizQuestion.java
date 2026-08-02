package com.survey.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "quiz_question")
@Getter
@Setter
@NoArgsConstructor
public class QuizQuestion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "quiz_id", nullable = false)
    private Integer quizId;

    @Column(nullable = false, length = 500)
    private String title;

    @Column(nullable = false, length = 10)
    private String type; // Q, M, T

    @Column(name = "is_required", nullable = false)
    private Boolean isRequired = false;

    @Column(columnDefinition = "JSON")
    private String options; // JSON string representing options array

    @Column(name = "sort_order")
    private Integer sortOrder = 0;
}
