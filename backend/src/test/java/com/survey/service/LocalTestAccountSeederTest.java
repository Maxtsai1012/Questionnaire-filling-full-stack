package com.survey.service;

import com.survey.entity.AppUser;
import com.survey.repository.AppUserRepository;
import com.survey.security.JwtTokenProvider;
import com.survey.security.MigratingPasswordEncoder;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.annotation.Profile;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;

@ExtendWith(MockitoExtension.class)
class LocalTestAccountSeederTest {
    @Mock
    private AppUserRepository repository;

    private final Map<String, AppUser> storedUsers = new LinkedHashMap<>();
    private LocalTestAccountSeeder seeder;
    private MigratingPasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        lenient().when(repository.findByEmailIgnoreCase(any())).thenAnswer(invocation ->
                Optional.ofNullable(storedUsers.get(invocation.getArgument(0, String.class))));
        lenient().when(repository.save(any(AppUser.class))).thenAnswer(invocation -> {
            AppUser user = invocation.getArgument(0, AppUser.class);
            storedUsers.put(user.getEmail(), user);
            return user;
        });
        passwordEncoder = new MigratingPasswordEncoder(4);
        seeder = new LocalTestAccountSeeder(new AuthService(
                repository, passwordEncoder, mock(JwtTokenProvider.class)));
    }

    @Test
    void createsMemberAndAdminWithHashedPasswords() throws Exception {
        seeder.run(null);

        assertEquals(2, storedUsers.size());
        assertAccount("user@example.com", "MEMBER", "user123");
        assertAccount("admin@example.com", "ADMIN", "admin123");
    }

    @Test
    void repeatedRunDoesNotCreateDuplicateEmails() throws Exception {
        seeder.run(null);
        String memberHash = storedUsers.get("user@example.com").getPasswordHash();
        String adminHash = storedUsers.get("admin@example.com").getPasswordHash();
        seeder.run(null);

        assertEquals(2, storedUsers.size());
        assertEquals("MEMBER", storedUsers.get("user@example.com").getRole());
        assertEquals("ADMIN", storedUsers.get("admin@example.com").getRole());
        assertEquals(memberHash, storedUsers.get("user@example.com").getPasswordHash());
        assertEquals(adminHash, storedUsers.get("admin@example.com").getPasswordHash());
    }

    @Test
    void repeatedRunPreservesExistingTokenVersion() throws Exception {
        AppUser existing = new AppUser();
        existing.setEmail("user@example.com");
        existing.setTokenVersion(9);
        storedUsers.put(existing.getEmail(), existing);

        seeder.run(null);
        seeder.run(null);

        assertEquals(9, storedUsers.get("user@example.com").getTokenVersion());
        assertEquals(0, storedUsers.get("admin@example.com").getTokenVersion());
    }

    @Test
    void isRestrictedToLocalProfile() {
        Profile profile = LocalTestAccountSeeder.class.getAnnotation(Profile.class);

        assertNotNull(profile);
        assertArrayEquals(new String[]{"local"}, profile.value());
    }

    @Test
    void preservesMatchingLegacyHashUntilSuccessfulLogin() throws Exception {
        AppUser existing = new AppUser();
        existing.setEmail("user@example.com");
        existing.setPasswordHash(legacyHash("user123"));
        existing.setTokenVersion(6);
        storedUsers.put(existing.getEmail(), existing);

        seeder.run(null);

        assertTrue(passwordEncoder.isLegacySha256(existing.getPasswordHash()));
        assertEquals(6, existing.getTokenVersion());
    }

    @Test
    void repairsOnlyMismatchedFixedAccountWithBcryptAndPreservesVersion() throws Exception {
        AppUser existing = new AppUser();
        existing.setEmail("user@example.com");
        existing.setPasswordHash(legacyHash("different-value"));
        existing.setTokenVersion(6);
        AppUser unrelated = new AppUser();
        unrelated.setEmail("other@example.com");
        unrelated.setPasswordHash(legacyHash("other-value"));
        storedUsers.put(existing.getEmail(), existing);
        storedUsers.put(unrelated.getEmail(), unrelated);

        seeder.run(null);

        assertTrue(passwordEncoder.isBcrypt(existing.getPasswordHash()));
        assertTrue(passwordEncoder.matches("user123", existing.getPasswordHash()));
        assertEquals(6, existing.getTokenVersion());
        assertTrue(passwordEncoder.isLegacySha256(unrelated.getPasswordHash()));
    }

    private String legacyHash(String value) throws Exception {
        return java.util.HexFormat.of().formatHex(java.security.MessageDigest.getInstance("SHA-256")
                .digest(value.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
    }

    private void assertAccount(String email, String role, String plainPassword) {
        AppUser user = storedUsers.get(email);
        assertNotNull(user);
        assertEquals(role, user.getRole());
        assertTrue(user.getPasswordHash().startsWith("{bcrypt}"));
        assertTrue(passwordEncoder.matches(plainPassword, user.getPasswordHash()));
        assertNotEquals(plainPassword, user.getPasswordHash());
    }
}
