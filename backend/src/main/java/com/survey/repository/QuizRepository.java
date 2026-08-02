package com.survey.repository;

import com.survey.entity.Quiz;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;

@Repository
public interface QuizRepository extends JpaRepository<Quiz, Integer> {

    @Query("SELECT q FROM Quiz q WHERE (:name IS NULL OR q.name LIKE CONCAT('%', :name, '%')) " +
           "AND (:startDate IS NULL OR q.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR q.endDate <= :endDate) " +
           "AND (:isPublished IS NULL OR q.isPublished = :isPublished) " +
           "ORDER BY q.id DESC")
    Page<Quiz> searchQuizzes(@Param("name") String name,
                            @Param("startDate") LocalDate startDate,
                            @Param("endDate") LocalDate endDate,
                            @Param("isPublished") Boolean isPublished,
                            Pageable pageable);

    @Query("SELECT q FROM Quiz q WHERE (:name IS NULL OR q.name LIKE CONCAT('%', :name, '%')) " +
           "AND (:startDate IS NULL OR q.startDate >= :startDate) " +
           "AND (:endDate IS NULL OR q.endDate <= :endDate) " +
           "ORDER BY q.id DESC")
    Page<Quiz> searchAdminQuizzes(@Param("name") String name,
                                 @Param("startDate") LocalDate startDate,
                                 @Param("endDate") LocalDate endDate,
                                 Pageable pageable);
}
