package com.survey.service;

import com.survey.dto.AuthDtos;
import com.survey.entity.AppUser;
import com.survey.repository.AppUserRepository;
import com.survey.security.JwtTokenProvider;
import com.survey.security.MigratingPasswordEncoder;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final AppUserRepository repository;
    private final MigratingPasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @Transactional
    public AuthDtos.AuthResponse register(AuthDtos.RegisterRequest req) {
        String email = req.getEmail().trim().toLowerCase();
        if (repository.existsByEmailIgnoreCase(email)) throw new IllegalArgumentException("此 Email 已註冊");
        String phone = normalizePhone(req.getPhone());
        AppUser user = new AppUser();
        user.setName(req.getName().trim());
        user.setEmail(email);
        user.setPhone(phone);
        user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
        return issue(repository.save(user));
    }

    @Transactional
    void ensureLocalTestAccount(String name, String email, String phone, String password, String role) {
        String normalizedEmail = email.trim().toLowerCase();
        AppUser user = repository.findByEmailIgnoreCase(normalizedEmail).orElseGet(AppUser::new);
        boolean isNew = user.getId() == null && user.getEmail() == null;
        user.setName(name);
        user.setEmail(normalizedEmail);
        user.setPhone(phone);
        user.setRole(role);
        if (isNew || !passwordEncoder.matches(password, user.getPasswordHash())) {
            user.setPasswordHash(passwordEncoder.encode(password));
        }
        repository.save(user);
    }

    @Transactional
    public AuthDtos.AuthResponse login(AuthDtos.LoginRequest req) {
        AppUser user = repository.findByEmailIgnoreCase(req.getEmail().trim())
                .orElseThrow(() -> new BadCredentialsException("帳號或密碼錯誤"));
        if (!passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("帳號或密碼錯誤");
        }
        if (passwordEncoder.needsUpgrade(user.getPasswordHash())) {
            user = upgradeLegacyPassword(user, req.getPassword());
        }
        return issue(user);
    }

    @Transactional
    public AuthDtos.AuthResponse updateProfile(AppUser user, AuthDtos.UpdateProfileRequest req) {
        String phone = normalizePhone(req.getPhone());
        String name = req.getName().trim().replaceAll("\\s+", " ");
        if (!name.matches("^[\\p{IsHan}A-Za-z]+(?:[ ]+[\\p{IsHan}A-Za-z]+)*$")) {
            throw new IllegalArgumentException("只允許填寫中文和英文");
        }
        user.setName(name);
        user.setPhone(phone);
        if (req.getNewPassword() != null && !req.getNewPassword().isBlank()) {
            repository.saveAndFlush(user);
            if (repository.changePasswordAndIncrementTokenVersion(
                    user.getId(), passwordEncoder.encode(req.getNewPassword())) != 1) {
                throw new IllegalStateException("密碼更新失敗");
            }
            AppUser updated = repository.findById(user.getId())
                    .orElseThrow(() -> new IllegalStateException("會員不存在"));
            return issue(updated);
        }
        return issue(repository.save(user));
    }

    public AuthDtos.AuthResponse summarize(AppUser user, String token) {
        return response(user, token);
    }

    @Transactional
    public void logout(Integer userId) {
        if (repository.incrementTokenVersion(userId) != 1) {
            throw new IllegalStateException("登出失敗");
        }
    }

    private String normalizePhone(String rawPhone) {
        String phone = rawPhone.replaceAll("[\\s-]", "");
        if (!phone.matches("09\\d{8}")) throw new IllegalArgumentException("手機格式不符");
        return phone;
    }

    private AuthDtos.AuthResponse issue(AppUser user) {
        return response(user, jwtTokenProvider.createToken(user.getId(), user.getTokenVersion()));
    }

    private AppUser upgradeLegacyPassword(AppUser user, String rawPassword) {
        String oldHash = user.getPasswordHash();
        String newHash = passwordEncoder.encode(rawPassword);
        int updated = repository.upgradePasswordHash(user.getId(), oldHash, newHash);
        AppUser current = repository.findById(user.getId())
                .orElseThrow(() -> new BadCredentialsException("帳號或密碼錯誤"));
        if (updated == 0 && !passwordEncoder.matches(rawPassword, current.getPasswordHash())) {
            throw new BadCredentialsException("帳號或密碼錯誤");
        }
        return current;
    }

    private AuthDtos.AuthResponse response(AppUser user, String token) {
        AuthDtos.AuthResponse out = new AuthDtos.AuthResponse();
        out.setToken(token);
        out.setTokenType("Bearer");
        out.setExpiresIn(jwtTokenProvider.getExpirationSeconds());
        out.setId(user.getId());
        out.setName(user.getName());
        out.setEmail(user.getEmail());
        out.setPhone(user.getPhone());
        out.setRole(user.getRole());
        return out;
    }
}
