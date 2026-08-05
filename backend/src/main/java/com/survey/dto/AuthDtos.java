package com.survey.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.Getter;
import lombok.Setter;

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
        @NotBlank private String password;
    }
    @Getter @Setter public static class AuthResponse {
        private String token;
        private String tokenType;
        private long expiresIn;
        private Integer id;
        private String name;
        private String email;
        private String phone;
        private String role;
    }
    @Getter @Setter public static class UpdateProfileRequest {
        @NotBlank private String name;
        @NotBlank private String phone;
        private String newPassword;
    }
}
