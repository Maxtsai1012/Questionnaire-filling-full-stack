package com.survey.repository;

import com.survey.entity.QuizOption;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizOptionRepository extends JpaRepository<QuizOption, Integer> {

    List<QuizOption> findByQuestionIdOrderBySortOrderAscIdAsc(Integer questionId);

    /** 一次撈整份問卷的選項，避免逐題查詢造成 N+1。 */
    List<QuizOption> findByQuestionIdInOrderBySortOrderAscIdAsc(List<Integer> questionIds);
}
