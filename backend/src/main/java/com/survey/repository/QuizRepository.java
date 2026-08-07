package com.survey.repository;

import com.survey.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.Optional;

/**
 * 三支搜尋的日期條件語意一致：「包含」——問卷的起訖日都要落在搜尋區間內
 * （q.startDate >= 搜尋起、q.endDate <= 搜尋迄），搜尋欄位與列表的
 * 開始／結束時間欄一一對應。單邊留白就只套用該邊的條件。
 */
@Repository
public interface QuizRepository extends JpaRepository<Quiz, Integer> {

    /** 前台列表：只看得到已發佈的問卷。 */
    @Query("SELECT q FROM Quiz q WHERE q.isPublished = true " +
           "AND (:name IS NULL OR q.name LIKE CONCAT('%', :name, '%')) " +
           "AND (:startDate IS NULL OR q.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR q.endDate <= :endDate) " +
           "ORDER BY q.id DESC")
    Page<Quiz> searchPublishedQuizzes(@Param("name") String name,
                                      @Param("startDate") LocalDate startDate,
                                      @Param("endDate") LocalDate endDate,
                                      Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE (:name IS NULL OR q.name LIKE CONCAT('%', :name, '%')) " +
           "AND (:startDate IS NULL OR q.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR q.endDate <= :endDate) " +
           "ORDER BY q.id DESC")
    Page<Quiz> searchAdminQuizzes(@Param("name") String name,
                                 @Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate,
                                 Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE q.owner.id = :ownerId " +
           "AND (:name IS NULL OR q.name LIKE CONCAT('%', :name, '%')) " +
           "AND (:startDate IS NULL OR q.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR q.endDate <= :endDate) " +
           "ORDER BY q.id DESC")
    Page<Quiz> searchOwnedQuizzes(@Param("ownerId") Integer ownerId,
                                  @Param("name") String name,
                                  @Param("startDate") LocalDate startDate,
                                  @Param("endDate") LocalDate endDate,
                                  Pageable pageable);

    Optional<Quiz> findByIdAndIsPublishedTrue(Integer id);
}
