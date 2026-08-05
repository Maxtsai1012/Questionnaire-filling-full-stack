package com.survey.controller;

import com.survey.dto.ApiResponse;
import com.survey.dto.AuthDtos;
import com.survey.security.UserPrincipal;
import com.survey.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final AuthService service;

    @PostMapping("/login") public ApiResponse<AuthDtos.AuthResponse> login(@Valid @RequestBody AuthDtos.LoginRequest req) {
        return ApiResponse.ok(service.login(req));
    }
    @PostMapping("/register") public ApiResponse<AuthDtos.AuthResponse> register(@Valid @RequestBody AuthDtos.RegisterRequest req) {
        return ApiResponse.ok(service.register(req));
    }
    @GetMapping("/me") public ApiResponse<AuthDtos.AuthResponse> me(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(service.summarize(principal.getUser(), null));
    }
    @PutMapping("/me") public ApiResponse<AuthDtos.AuthResponse> update(@AuthenticationPrincipal UserPrincipal principal,
                                                                        @Valid @RequestBody AuthDtos.UpdateProfileRequest req) {
        return ApiResponse.ok("會員資料修改成功", service.updateProfile(principal.getUser(), req));
    }
    @PostMapping("/logout") public ApiResponse<Void> logout(@AuthenticationPrincipal UserPrincipal principal) {
        service.logout(principal.getUserId());
        return ApiResponse.ok("登出成功", null);
    }
}
