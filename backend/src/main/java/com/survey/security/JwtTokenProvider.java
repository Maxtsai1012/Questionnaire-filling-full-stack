package com.survey.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.util.Date;

@Component
public class JwtTokenProvider {
    private final String secret;
    private final long expirationSeconds;
    private final Clock clock;
    private SecretKey signingKey;

    @Autowired
    public JwtTokenProvider(@Value("${app.security.jwt.secret}") String secret,
                            @Value("${app.security.jwt.expiration-seconds:86400}") long expirationSeconds) {
        this(secret, expirationSeconds, Clock.systemUTC());
    }

    JwtTokenProvider(String secret, long expirationSeconds, Clock clock) {
        this.secret = secret;
        this.expirationSeconds = expirationSeconds;
        this.clock = clock;
    }

    @PostConstruct
    void initialize() {
        if (secret == null || secret.getBytes(StandardCharsets.UTF_8).length < 32) {
            throw new IllegalStateException("JWT_SECRET 必須設定且至少為 32 個 UTF-8 bytes");
        }
        if (expirationSeconds <= 0) throw new IllegalStateException("JWT expiration 必須大於 0");
        signingKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String createToken(Integer userId, Integer tokenVersion) {
        if (tokenVersion == null || tokenVersion < 0) throw new IllegalArgumentException("Token version 不合法");
        Instant issuedAt = clock.instant();
        return Jwts.builder().subject(userId.toString()).claim("tokenVersion", tokenVersion).issuedAt(Date.from(issuedAt))
                .expiration(Date.from(issuedAt.plusSeconds(expirationSeconds)))
                .signWith(signingKey).compact();
    }

    public Integer parseUserId(String token) {
        return parseToken(token).userId();
    }

    public ParsedToken parseToken(String token) {
        Claims claims = Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token).getPayload();
        Integer userId = Integer.valueOf(claims.getSubject());
        Object versionClaim = claims.get("tokenVersion");
        if (!(versionClaim instanceof Integer tokenVersion) || tokenVersion < 0) {
            throw new IllegalArgumentException("JWT tokenVersion claim 不合法");
        }
        return new ParsedToken(userId, tokenVersion);
    }

    public long getExpirationSeconds() { return expirationSeconds; }

    public record ParsedToken(Integer userId, Integer tokenVersion) {}
}
