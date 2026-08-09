package com.survey.service;

import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

class ListPageableFactoryTest {

    @Test
    void quizStatusSortUsesComputedStatusAndRequestedDirection() {
        Pageable pageable = ListPageableFactory.quizzes(2, 25, "status", "asc");

        assertEquals(2, pageable.getPageNumber());
        assertEquals(25, pageable.getPageSize());
        Sort.Order status = pageable.getSort().getOrderFor("effectiveStatusSort");
        assertNotNull(status);
        assertEquals(Sort.Direction.ASC, status.getDirection());
    }

    @Test
    void responseSortWhitelistsFieldsAndFallsBackToId() {
        Pageable named = ListPageableFactory.responses(0, 10, "respondentName", "asc");
        Pageable unknown = ListPageableFactory.responses(0, 10, "notAColumn", "asc");

        assertNotNull(named.getSort().getOrderFor("respondentName"));
        assertNotNull(unknown.getSort().getOrderFor("id"));
    }
}
