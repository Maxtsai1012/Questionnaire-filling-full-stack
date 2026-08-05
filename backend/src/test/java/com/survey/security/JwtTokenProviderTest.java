package com.survey.security;

import io.jsonwebtoken.ExpiredJwtException;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.Arrays;
import java.util.Base64;
import java.util.Date;

import static org.junit.jupiter.api.Assertions.*;

class JwtTokenProviderTest {
    private static final String SECRET = "test-only-jwt-secret-at-least-32-bytes";

    @Test
    void createsJwtWithUserIdSubjectAndNoSensitiveClaims() {
        JwtTokenProvider provider = provider(SECRET, 3600, Clock.systemUTC());
        String token = provider.createToken(42, 3);

        assertEquals(42, provider.parseUserId(token));
        assertEquals(3, provider.parseToken(token).tokenVersion());
        String payload = new String(Base64.getUrlDecoder().decode(token.split("\\.")[1]), StandardCharsets.UTF_8);
        assertTrue(payload.contains("\"sub\":\"42\""));
        assertTrue(payload.contains("\"iat\":"));
        assertTrue(payload.contains("\"exp\":"));
        assertTrue(payload.contains("\"tokenVersion\":3"));
        assertFalse(payload.contains("password"));
        assertFalse(payload.contains("email"));
        assertFalse(payload.contains("role"));
    }

    @Test void rejectsTamperedJwt() {
        JwtTokenProvider provider = provider(SECRET, 3600, Clock.systemUTC());
        String token = provider.createToken(7, 0);
        String[] segments = token.split("\\.");
        assertEquals(3, segments.length);

        byte[] signatureBytes = Base64.getUrlDecoder().decode(segments[2]);
        assertTrue(signatureBytes.length > 0);
        byte[] tamperedSignatureBytes = Arrays.copyOf(signatureBytes, signatureBytes.length);
        tamperedSignatureBytes[0] = (byte) (tamperedSignatureBytes[0] ^ 0x01);

        assertFalse(Arrays.equals(signatureBytes, tamperedSignatureBytes));
        String tamperedSignature = Base64.getUrlEncoder().withoutPadding().encodeToString(tamperedSignatureBytes);
        String tamperedToken = segments[0] + "." + segments[1] + "." + tamperedSignature;

        assertNotEquals(token, tamperedToken);
        assertEquals(7, provider.parseUserId(token));
        assertThrows(JwtException.class, () -> provider.parseUserId(tamperedToken));
    }

    @Test void rejectsExpiredJwt() {
        JwtTokenProvider oldProvider = provider(SECRET, 1,
                Clock.fixed(Instant.parse("2020-01-01T00:00:00Z"), ZoneOffset.UTC));
        assertThrows(ExpiredJwtException.class, () -> oldProvider.parseUserId(oldProvider.createToken(7, 0)));
    }

    @Test void rejectsMalformedJwtAndNonNumericSubject() {
        JwtTokenProvider provider = provider(SECRET, 3600, Clock.systemUTC());
        assertThrows(JwtException.class, () -> provider.parseUserId("not-a-jwt"));
    }

    @Test void rejectsMissingOrWeakSecret() {
        assertThrows(IllegalStateException.class, () -> provider("short", 3600, Clock.systemUTC()));
    }

    @Test void rejectsMissingNonNumericAndNegativeTokenVersion() {
        JwtTokenProvider provider = provider(SECRET, 3600, Clock.systemUTC());
        assertThrows(IllegalArgumentException.class, () -> provider.parseToken(customToken(null)));
        assertThrows(IllegalArgumentException.class, () -> provider.parseToken(customToken("one")));
        assertThrows(IllegalArgumentException.class, () -> provider.parseToken(customToken(-1)));
    }

    private String customToken(Object tokenVersion) {
        var builder = Jwts.builder().subject("7").issuedAt(new Date())
                .expiration(Date.from(Instant.now().plusSeconds(3600)));
        if (tokenVersion != null) builder.claim("tokenVersion", tokenVersion);
        return builder.signWith(Keys.hmacShaKeyFor(SECRET.getBytes(StandardCharsets.UTF_8))).compact();
    }

    private JwtTokenProvider provider(String secret, long expiry, Clock clock) {
        JwtTokenProvider provider = new JwtTokenProvider(secret, expiry, clock);
        provider.initialize();
        return provider;
    }
}
