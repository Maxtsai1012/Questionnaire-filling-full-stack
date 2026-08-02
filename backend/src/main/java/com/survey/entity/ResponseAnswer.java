package com.survey.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "response_answer")
@Getter
@Setter
@NoArgsConstructor
public class ResponseAnswer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "response_id", nullable = false)
    private Integer responseId;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    @Column(columnDefinition = "TEXT")
    private String answer;
}
