package com.survey.repository;

import com.survey.entity.ResponseAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ResponseAnswerRepository extends JpaRepository<ResponseAnswer, Integer> {

    List<ResponseAnswer> findByQuestionId(Integer questionId);
    List<ResponseAnswer> findByResponseId(Integer responseId);

    // 效能優化 1：一次查詢整個問卷的所有問題回答，避免 N+1 查詢問題
    @Query("SELECT ra FROM ResponseAnswer ra WHERE ra.questionId IN :questionIds")
    List<ResponseAnswer> findByQuestionIdIn(@Param("questionIds") List<Integer> questionIds);

    // 效能優化 2：DB 層級聚合作答次數統計 (全量聚合成行記錄，直接由 MySQL 計算)
    @Query("SELECT ra.questionId AS questionId, ra.answer AS answer, COUNT(ra.id) AS count " +
           "FROM ResponseAnswer ra WHERE ra.questionId IN :questionIds " +
           "GROUP BY ra.questionId, ra.answer")
    List<Object[]> countAnswersByQuestionIds(@Param("questionIds") List<Integer> questionIds);
}
