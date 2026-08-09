package com.survey.repository;

import com.survey.entity.QuizResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface QuizResponseRepository extends JpaRepository<QuizResponse, Integer> {
    boolean existsByQuizIdAndEmail(Integer quizId, String email);
    int countByQuizId(Integer quizId);
    @Query("SELECT response FROM QuizResponse response " +
           "WHERE response.quizId = :quizId " +
           "AND (:respondentName IS NULL OR LOWER(response.respondentName) " +
           "LIKE LOWER(CONCAT('%', :respondentName, '%')))")
    Page<QuizResponse> searchByQuizId(@Param("quizId") Integer quizId,
                                      @Param("respondentName") String respondentName,
                                      Pageable pageable);
    java.util.Optional<QuizResponse> findByQuizIdAndUserId(Integer quizId, Integer userId);

    @Query("SELECT response.quizId, COUNT(response) FROM QuizResponse response " +
           "WHERE response.quizId IN :quizIds GROUP BY response.quizId")
    java.util.List<Object[]> countByQuizIds(@Param("quizIds") java.util.List<Integer> quizIds);
}
