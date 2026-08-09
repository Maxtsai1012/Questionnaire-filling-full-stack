package com.survey.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.Formula;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "quiz")
@Getter
@Setter
@NoArgsConstructor
public class Quiz {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "end_date", nullable = false)
    private LocalDate endDate;

    @Column(name = "is_published", nullable = false)
    private Boolean isPublished = false;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.VARCHAR)
    @Column(name = "admin_status_override", length = 32)
    private com.survey.enums.QuizStatus adminStatusOverride;

    @ManyToOne(fetch = FetchType.LAZY, optional = true)
    @JoinColumn(name = "owner_id")
    private AppUser owner;

    @Column(name = "created_at", insertable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", insertable = false, updatable = false)
    private LocalDateTime updatedAt;

    /** 排序用的即時狀態順位：未發佈、尚未開始、進行中、已結束。 */
    @Formula("""
            CASE
                WHEN admin_status_override = 'UNPUBLISHED' THEN 0
                WHEN admin_status_override = 'NOT_STARTED' THEN 1
                WHEN admin_status_override = 'IN_PROGRESS' THEN 2
                WHEN admin_status_override = 'ENDED' THEN 3
                WHEN is_published = false THEN 0
                WHEN start_date > CURRENT_DATE THEN 1
                WHEN end_date < CURRENT_DATE THEN 3
                ELSE 2
            END
            """)
    private Integer effectiveStatusSort;
}
