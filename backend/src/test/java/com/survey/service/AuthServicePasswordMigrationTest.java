package com.survey.service;

import com.survey.dto.AuthDtos;
import com.survey.entity.AppUser;
import com.survey.repository.AppUserRepository;
import com.survey.security.JwtTokenProvider;
import com.survey.security.MigratingPasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class AuthServicePasswordMigrationTest {
    private AppUserRepository repository;
    private JwtTokenProvider jwtTokenProvider;
    private MigratingPasswordEncoder encoder;
    private AuthService service;

    @BeforeEach void setUp() {
        repository = mock(AppUserRepository.class);
        jwtTokenProvider = mock(JwtTokenProvider.class);
        encoder = new MigratingPasswordEncoder(4);
        service = new AuthService(repository, encoder, jwtTokenProvider);
        when(jwtTokenProvider.createToken(anyInt(), anyInt())).thenReturn("test-token");
        when(jwtTokenProvider.getExpirationSeconds()).thenReturn(3600L);
    }

    @Test void successfulLegacyLoginUpgradesHashWithoutChangingTokenVersion() throws Exception {
        AppUser legacy = user(1, legacyHash("correct-value"), 7);
        AppUser upgraded = user(1, encoder.encode("correct-value"), 7);
        when(repository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(legacy));
        when(repository.upgradePasswordHash(eq(1), eq(legacy.getPasswordHash()), startsWith("{bcrypt}"))).thenReturn(1);
        when(repository.findById(1)).thenReturn(Optional.of(upgraded));

        AuthDtos.AuthResponse response = service.login(login("member@example.com", "correct-value"));

        assertEquals("test-token", response.getToken());
        verify(jwtTokenProvider).createToken(1, 7);
        verify(repository).upgradePasswordHash(eq(1), eq(legacy.getPasswordHash()), startsWith("{bcrypt}"));
    }

    @Test void wrongLegacyPasswordDoesNotUpgradeOrIssueJwt() throws Exception {
        AppUser legacy = user(1, legacyHash("correct-value"), 7);
        when(repository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(legacy));

        assertThrows(BadCredentialsException.class,
                () -> service.login(login("member@example.com", "wrong-value")));
        verify(repository, never()).upgradePasswordHash(anyInt(), anyString(), anyString());
        verify(jwtTokenProvider, never()).createToken(anyInt(), anyInt());
    }

    @Test void bcryptLoginDoesNotRehash() {
        String bcrypt = encoder.encode("correct-value");
        AppUser current = user(1, bcrypt, 7);
        when(repository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(current));

        service.login(login("member@example.com", "correct-value"));

        assertSame(bcrypt, current.getPasswordHash());
        verify(repository, never()).upgradePasswordHash(anyInt(), anyString(), anyString());
        verify(jwtTokenProvider).createToken(1, 7);
    }

    @Test void concurrentCasMissAcceptsAlreadyUpgradedMatchingHash() throws Exception {
        AppUser legacy = user(1, legacyHash("correct-value"), 7);
        AppUser concurrentlyUpgraded = user(1, encoder.encode("correct-value"), 7);
        when(repository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(legacy));
        when(repository.upgradePasswordHash(anyInt(), anyString(), anyString())).thenReturn(0);
        when(repository.findById(1)).thenReturn(Optional.of(concurrentlyUpgraded));

        assertDoesNotThrow(() -> service.login(login("member@example.com", "correct-value")));
        verify(jwtTokenProvider).createToken(1, 7);
    }

    @Test void unknownHashFormatIsRejectedWithoutIssuingJwt() {
        AppUser damaged = user(1, "{unknown}value", 7);
        when(repository.findByEmailIgnoreCase("member@example.com")).thenReturn(Optional.of(damaged));

        assertThrows(BadCredentialsException.class,
                () -> service.login(login("member@example.com", "correct-value")));
        verify(jwtTokenProvider, never()).createToken(anyInt(), anyInt());
        verify(repository, never()).upgradePasswordHash(anyInt(), anyString(), anyString());
    }

    @Test void realPasswordChangeUsesBcryptAndIncrementsTokenVersion() {
        AppUser current = user(1, encoder.encode("old-value"), 7);
        AppUser updated = user(1, encoder.encode("new-value"), 8);
        when(repository.saveAndFlush(current)).thenReturn(current);
        when(repository.changePasswordAndIncrementTokenVersion(eq(1), startsWith("{bcrypt}"))).thenReturn(1);
        when(repository.findById(1)).thenReturn(Optional.of(updated));
        AuthDtos.UpdateProfileRequest request = new AuthDtos.UpdateProfileRequest();
        request.setName("Test User");
        request.setPhone("0912345678");
        request.setNewPassword("new-value");

        AuthDtos.AuthResponse response = service.updateProfile(current, request);

        assertEquals("test-token", response.getToken());
        verify(repository).changePasswordAndIncrementTokenVersion(eq(1), startsWith("{bcrypt}"));
        verify(jwtTokenProvider).createToken(1, 8);
    }

    @Test void registrationStoresBcryptWithMemberDefaults() {
        when(repository.existsByEmailIgnoreCase("new@example.com")).thenReturn(false);
        when(repository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser saved = invocation.getArgument(0);
            saved.setId(9);
            return saved;
        });
        AuthDtos.RegisterRequest request = new AuthDtos.RegisterRequest();
        request.setName("Test User");
        request.setEmail("new@example.com");
        request.setPhone("0912345678");
        request.setPassword("new-value");

        AuthDtos.AuthResponse response = service.register(request);

        AppUser saved = mockingDetails(repository).getInvocations().stream()
                .filter(call -> call.getMethod().getName().equals("save"))
                .map(call -> (AppUser) call.getArgument(0)).findFirst().orElseThrow();
        assertTrue(saved.getPasswordHash().startsWith("{bcrypt}"));
        assertEquals("MEMBER", saved.getRole());
        assertEquals(0, saved.getTokenVersion());
        assertEquals("MEMBER", response.getRole());
    }

    private AuthDtos.LoginRequest login(String email, String password) {
        AuthDtos.LoginRequest request = new AuthDtos.LoginRequest();
        request.setEmail(email);
        request.setPassword(password);
        return request;
    }

    private AppUser user(int id, String hash, int tokenVersion) {
        AppUser user = new AppUser();
        user.setId(id);
        user.setName("Test User");
        user.setEmail("member@example.com");
        user.setPhone("0912345678");
        user.setPasswordHash(hash);
        user.setTokenVersion(tokenVersion);
        return user;
    }

    private String legacyHash(String value) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
