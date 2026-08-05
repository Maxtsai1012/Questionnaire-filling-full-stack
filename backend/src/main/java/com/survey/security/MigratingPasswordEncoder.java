package com.survey.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.regex.Pattern;

@Component
public class MigratingPasswordEncoder implements PasswordEncoder {
    private static final String BCRYPT_PREFIX = "{bcrypt}";
    private static final Pattern LEGACY_SHA256 = Pattern.compile("^[0-9a-fA-F]{64}$");
    private static final Pattern BCRYPT = Pattern.compile(
            "^\\{bcrypt}\\$2[aby]\\$\\d{2}\\$[./A-Za-z0-9]{53}$");

    private final BCryptPasswordEncoder bcrypt;

    public MigratingPasswordEncoder(
            @Value("${app.security.password.bcrypt-strength:12}") int strength) {
        if (strength < 4 || strength > 31) {
            throw new IllegalArgumentException("BCrypt strength 必須介於 4 與 31");
        }
        this.bcrypt = new BCryptPasswordEncoder(strength);
    }

    @Override
    public String encode(CharSequence rawPassword) {
        if (rawPassword == null) throw new IllegalArgumentException("密碼不得為 null");
        return BCRYPT_PREFIX + bcrypt.encode(rawPassword);
    }

    @Override
    public boolean matches(CharSequence rawPassword, String storedHash) {
        if (rawPassword == null || storedHash == null || storedHash.isBlank()) return false;
        try {
            if (isBcrypt(storedHash)) {
                return bcrypt.matches(rawPassword, storedHash.substring(BCRYPT_PREFIX.length()));
            }
            if (isLegacySha256(storedHash)) {
                byte[] actual = sha256(rawPassword).getBytes(StandardCharsets.US_ASCII);
                byte[] expected = storedHash.toLowerCase().getBytes(StandardCharsets.US_ASCII);
                return MessageDigest.isEqual(actual, expected);
            }
            return false;
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    public boolean isLegacySha256(String storedHash) {
        return storedHash != null && LEGACY_SHA256.matcher(storedHash).matches();
    }

    public boolean isBcrypt(String storedHash) {
        return storedHash != null && BCRYPT.matcher(storedHash).matches();
    }

    public boolean needsUpgrade(String storedHash) {
        return isLegacySha256(storedHash);
    }

    private String sha256(CharSequence rawPassword) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                    .digest(rawPassword.toString().getBytes(StandardCharsets.UTF_8)));
        } catch (Exception ex) {
            throw new IllegalStateException("密碼處理失敗", ex);
        }
    }
}
