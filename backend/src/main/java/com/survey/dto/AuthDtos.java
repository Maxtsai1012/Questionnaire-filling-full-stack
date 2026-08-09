package com.survey.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PastOrPresent;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

public final class AuthDtos {
    private AuthDtos() {}

    @Getter @Setter public static class LoginRequest {
        @NotBlank @Email private String email;
        @NotBlank private String password;
    }
    @Getter @Setter public static class RegisterRequest {
        @NotBlank private String name;
        @NotBlank @Email private String email;
        @NotBlank private String phone;
        @NotNull @PastOrPresent private LocalDate birthday;
        @NotBlank
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
                message = "密碼至少需要 8 個字元，並包含英文字母與數字")
        private String password;
    }
    @Getter @Setter public static class AuthResponse {
        private String token;
        private String tokenType;
        private long expiresIn;
        private Integer id;
        private String name;
        private String email;
        private String phone;
        private LocalDate birthday;
        private String role;
    }
    @Getter @Setter public static class UpdateProfileRequest {
        @NotBlank private String name;
        @NotBlank private String phone;
        @NotNull @PastOrPresent private LocalDate birthday;
    }
    @Getter @Setter public static class ChangePasswordRequest {
        @NotBlank private String currentPassword;
        @NotBlank
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
                message = "密碼至少需要 8 個字元，並包含英文字母與數字")
        private String newPassword;
    }
}
