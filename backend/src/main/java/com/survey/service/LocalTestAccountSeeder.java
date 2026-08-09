package com.survey.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@Profile("local")
@RequiredArgsConstructor
public class LocalTestAccountSeeder implements ApplicationRunner {
    private static final LocalDate DEFAULT_BIRTHDAY = LocalDate.of(2022, 10, 28);

    private final AuthService authService;

    @Override
    public void run(ApplicationArguments args) {
        authService.ensureLocalTestAccount(
                "測試會員", "user@example.com", "0911111111", DEFAULT_BIRTHDAY, "user123", "MEMBER");
        authService.ensureLocalTestAccount(
                "系統管理員", "admin@example.com", "0922222222", DEFAULT_BIRTHDAY, "admin123", "ADMIN");
    }
}
