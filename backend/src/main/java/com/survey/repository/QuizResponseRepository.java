package com.survey.repository;

import com.survey.entity.QuizResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizResponseRepository extends JpaRepository<QuizResponse, Integer> {
    boolean existsByQuizIdAndEmail(Integer quizId, String email);
    int countByQuizId(Integer quizId);
    Page<QuizResponse> findByQuizIdOrderByIdDesc(Integer quizId, Pageable pageable);
}
