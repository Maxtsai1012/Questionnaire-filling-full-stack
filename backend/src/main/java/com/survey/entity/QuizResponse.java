package com.survey.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "quiz_response", uniqueConstraints = {
    @UniqueConstraint(name = "uk_quiz_email", columnNames = {"quiz_id", "email"})
})
@Getter
@Setter
@NoArgsConstructor
public class QuizResponse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "quiz_id", nullable = false)
    private Integer quizId;

    @Column(name = "user_id")
    private Integer userId;

    @Column(name = "respondent_name", nullable = false, length = 100)
    private String respondentName;

    @Column(name = "normalized_name", length = 100)
    private String normalizedName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "normalized_phone", length = 20)
    private String normalizedPhone;

    @Column(nullable = false, length = 255)
    private String email;

    private Integer age;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @PrePersist
    public void prePersist() {
        if (submittedAt == null) {
            submittedAt = LocalDateTime.now();
        }
    }
}
