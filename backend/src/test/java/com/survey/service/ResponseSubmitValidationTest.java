package com.survey.service;

import com.survey.dto.ResponseSubmitDto;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ResponseSubmitValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void ageIsRequiredAndCannotBeNegative() {
        ResponseSubmitDto request = new ResponseSubmitDto();

        assertFalse(validator.validateProperty(request, "age").isEmpty());
        request.setAge(-1);
        assertFalse(validator.validateProperty(request, "age").isEmpty());
        request.setAge(0);
        assertTrue(validator.validateProperty(request, "age").isEmpty());
    }
}
