package com.survey.repository;

import com.survey.entity.QuizQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface QuizQuestionRepository extends JpaRepository<QuizQuestion, Integer> {
    List<QuizQuestion> findByQuizIdOrderBySortOrderAscIdAsc(Integer quizId);
    void deleteByQuizId(Integer quizId);
}
