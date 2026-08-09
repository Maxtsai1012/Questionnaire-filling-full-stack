package com.survey.service;

import com.survey.dto.AuthDtos;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class AuthPasswordValidationTest {
    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void registrationRequiresAtLeastEightCharactersWithLetterAndDigit() {
        AuthDtos.RegisterRequest request = validRegistration();

        request.setPassword("onlyletters");
        assertFalse(validator.validateProperty(request, "password").isEmpty());
        request.setPassword("12345678");
        assertFalse(validator.validateProperty(request, "password").isEmpty());
        request.setPassword("abc12345");
        assertTrue(validator.validateProperty(request, "password").isEmpty());
    }

    @Test
    void changePasswordUsesSameRuleWhileLoginKeepsLegacyCompatibility() {
        AuthDtos.ChangePasswordRequest change = new AuthDtos.ChangePasswordRequest();
        change.setCurrentPassword("legacy");
        change.setNewPassword("short1");
        assertFalse(validator.validateProperty(change, "newPassword").isEmpty());
        change.setNewPassword("secure123");
        assertTrue(validator.validateProperty(change, "newPassword").isEmpty());

        AuthDtos.LoginRequest login = new AuthDtos.LoginRequest();
        login.setEmail("member@example.com");
        login.setPassword("user123");
        assertTrue(validator.validate(login).isEmpty());
    }

    @Test
    void registrationRequiresBirthdayThatIsNotInTheFuture() {
        AuthDtos.RegisterRequest request = validRegistration();

        request.setBirthday(null);
        assertFalse(validator.validateProperty(request, "birthday").isEmpty());
        request.setBirthday(LocalDate.now().plusDays(1));
        assertFalse(validator.validateProperty(request, "birthday").isEmpty());
        request.setBirthday(LocalDate.now());
        assertTrue(validator.validateProperty(request, "birthday").isEmpty());
    }

    @Test
    void profileUpdateAlsoRequiresBirthdayThatIsNotInTheFuture() {
        AuthDtos.UpdateProfileRequest request = new AuthDtos.UpdateProfileRequest();
        request.setName("Test User");
        request.setPhone("0912345678");

        assertFalse(validator.validateProperty(request, "birthday").isEmpty());
        request.setBirthday(LocalDate.now().plusDays(1));
        assertFalse(validator.validateProperty(request, "birthday").isEmpty());
        request.setBirthday(LocalDate.of(1990, 5, 20));
        assertTrue(validator.validate(request).isEmpty());
    }

    private AuthDtos.RegisterRequest validRegistration() {
        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest();
        request.setName("Test User");
        request.setEmail("new@example.com");
        request.setPhone("0912345678");
        request.setBirthday(LocalDate.of(2000, 1, 1));
        request.setPassword("secure123");
        return request;
    }
}
