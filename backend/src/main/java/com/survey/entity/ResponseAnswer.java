package com.survey.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.LinkedHashSet;
import java.util.Set;

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

    /**
     * 文字題：答案本身。
     * 選擇題：填答當下看到的文字快照。選項 label 之後可能被改，快照保留使用者
     * 實際點下去的內容；作為統計依據的是 selectedOptionIds，兩者互補而非重複。
     */
    @Column(columnDefinition = "TEXT")
    private String answer;

    /**
     * 用 @ElementCollection 而非獨立 entity：這張表只是純連結，沒有自己的行為，
     * 交給 JPA 隨父列一起寫入／刪除即可，省掉一個 entity + IdClass + repository。
     */
    @ElementCollection(fetch = FetchType.LAZY)
    @CollectionTable(
        name = "response_answer_option",
        joinColumns = @JoinColumn(name = "answer_id")
    )
    @Column(name = "option_id", nullable = false)
    private Set<Integer> selectedOptionIds = new LinkedHashSet<>();
}
