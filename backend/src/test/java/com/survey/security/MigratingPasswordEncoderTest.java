package com.survey.security;

import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import static org.junit.jupiter.api.Assertions.*;

class MigratingPasswordEncoderTest {
    private final MigratingPasswordEncoder encoder = new MigratingPasswordEncoder(4);

    @Test void encodesNewPasswordsAsPrefixedBcrypt() {
        String encoded = encoder.encode("test-value");
        assertTrue(encoded.startsWith("{bcrypt}$2"));
        assertTrue(encoder.isBcrypt(encoded));
        assertFalse(encoder.isLegacySha256(encoded));
        assertFalse(encoded.matches("^[0-9a-fA-F]{64}$"));
    }

    @Test void matchesBcryptAndRejectsWrongPassword() {
        String encoded = encoder.encode("test-value");
        assertTrue(encoder.matches("test-value", encoded));
        assertFalse(encoder.matches("wrong-value", encoded));
    }

    @Test void matchesLegacySha256AndMarksItForUpgrade() throws Exception {
        String legacy = HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256")
                .digest("test-value".getBytes(StandardCharsets.UTF_8)));
        assertTrue(encoder.isLegacySha256(legacy));
        assertTrue(encoder.needsUpgrade(legacy));
        assertTrue(encoder.matches("test-value", legacy));
        assertFalse(encoder.matches("wrong-value", legacy));
    }

    @Test void rejectsNullBlankUnknownAndTruncatedFormats() {
        assertFalse(encoder.matches("test-value", null));
        assertFalse(encoder.matches("test-value", "   "));
        assertFalse(encoder.matches("test-value", "{noop}test-value"));
        assertFalse(encoder.matches("test-value", "{bcrypt}$2a$truncated"));
        assertFalse(encoder.isBcrypt("{bcrypt}$2a$truncated"));
        assertFalse(encoder.isLegacySha256("not-a-hash"));
        assertFalse(encoder.isBcrypt("{argon2}value"));
    }

    @Test void rejectsInvalidStrength() {
        assertThrows(IllegalArgumentException.class, () -> new MigratingPasswordEncoder(3));
        assertThrows(IllegalArgumentException.class, () -> new MigratingPasswordEncoder(32));
    }
}
