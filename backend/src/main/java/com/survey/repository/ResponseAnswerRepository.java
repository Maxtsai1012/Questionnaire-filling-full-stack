package com.survey.repository;

import com.survey.entity.ResponseAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResponseAnswerRepository extends JpaRepository<ResponseAnswer, Integer> {

    List<ResponseAnswer> findByResponseId(Integer responseId);

    /** 每題的作答人數（有建列就代表有作答，空白答案不建列）。 */
    @Query("SELECT ra.questionId, COUNT(ra) FROM ResponseAnswer ra " +
           "WHERE ra.questionId IN :questionIds GROUP BY ra.questionId")
    List<Object[]> countAnswersByQuestion(@Param("questionIds") List<Integer> questionIds);

    /** 選擇題票數：直接在 DB 聚合，不再把整批答案拉回 JVM 分組。 */
    @Query("SELECT o, COUNT(ra) FROM ResponseAnswer ra JOIN ra.selectedOptionIds o " +
           "WHERE ra.questionId IN :questionIds GROUP BY o")
    List<Object[]> countVotesByOption(@Param("questionIds") List<Integer> questionIds);

    /** 文字題答案分佈。 */
    @Query("SELECT ra.questionId, ra.answer, COUNT(ra) FROM ResponseAnswer ra " +
           "WHERE ra.questionId IN :questionIds GROUP BY ra.questionId, ra.answer")
    List<Object[]> countTextAnswers(@Param("questionIds") List<Integer> questionIds);
}
