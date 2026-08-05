package com.survey.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

@Component
@Profile("local")
@RequiredArgsConstructor
public class LocalTestAccountSeeder implements ApplicationRunner {
    private final AuthService authService;

    @Override
    public void run(ApplicationArguments args) {
        authService.ensureLocalTestAccount(
                "測試會員", "user@example.com", "0911111111", "user123", "MEMBER");
        authService.ensureLocalTestAccount(
                "系統管理員", "admin@example.com", "0922222222", "admin123", "ADMIN");
    }
}
