package com.survey.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * 選項自成一列，答案指向它的 id。label 可以任意修改而不影響既有答案，
 * 這是選項存 JSON、答案存顯示文字時做不到的。
 */
@Entity
@Table(name = "quiz_option")
@Getter
@Setter
@NoArgsConstructor
public class QuizOption {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "question_id", nullable = false)
    private Integer questionId;

    /** 題目內的選項代碼，前端送答案時使用（同一題內唯一）。 */
    @Column(nullable = false)
    private Integer code;

    @Column(nullable = false, length = 500)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    public QuizOption(Integer questionId, Integer code, String label, Integer sortOrder) {
        this.questionId = questionId;
        this.code = code;
        this.label = label;
        this.sortOrder = sortOrder;
    }
}
