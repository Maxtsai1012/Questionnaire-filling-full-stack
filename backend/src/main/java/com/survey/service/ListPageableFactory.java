package com.survey.service;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;

final class ListPageableFactory {
    private ListPageableFactory() {}

    static Pageable quizzes(int page, int size, String sortBy, String sortDirection) {
        String property = switch (normalize(sortBy)) {
            case "name" -> "name";
            case "status" -> "effectiveStatusSort";
            case "startdate" -> "startDate";
            case "enddate" -> "endDate";
            default -> "id";
        };
        return page(page, size, property, sortDirection);
    }

    static Pageable responses(int page, int size, String sortBy, String sortDirection) {
        String property = switch (normalize(sortBy)) {
            case "respondentname" -> "respondentName";
            case "submittedat" -> "submittedAt";
            default -> "id";
        };
        return page(page, size, property, sortDirection);
    }

    private static Pageable page(int page, int size, String property, String sortDirection) {
        Sort.Direction direction = "asc".equalsIgnoreCase(sortDirection)
                ? Sort.Direction.ASC
                : Sort.Direction.DESC;
        Sort sort = Sort.by(direction, property);
        if (!"id".equals(property)) {
            sort = sort.and(Sort.by(direction, "id"));
        }
        return PageRequest.of(page, size, sort);
    }

    private static String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase();
    }
}
