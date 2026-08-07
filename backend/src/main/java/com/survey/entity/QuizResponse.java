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

    // 姓名／電話／Email 是填答當下的快照，不隨會員之後修改資料而變動——
    // 填答紀錄是歷史事實，不該 JOIN app_user 取代掉。
    @Column(name = "respondent_name", nullable = false, length = 100)
    private String respondentName;

    @Column(nullable = false, length = 20)
    private String phone;

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
