package com.kostone.marble.security;

import com.kostone.marble.domain.user.FeatureKey;
import com.kostone.marble.domain.user.UserRole;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.List;
import java.util.UUID;

@Component
public class JwtUtil {

    private static final String CLAIM_ROLE = "role";
    private static final String CLAIM_FEATURES = "grantedFeatures";
    private static final String CLAIM_TYPE = "tokenType";
    private static final String TYPE_USER = "USER";
    private static final String TYPE_CUSTOMER = "CUSTOMER";

    private final SecretKey signingKey;
    private final long userExpirationMs;
    private final long customerExpirationMs;

    public JwtUtil(
            @Value("${app.jwt.signing-key}") String signingKeyStr,
            @Value("${app.jwt.expiration-ms}") long userExpirationMs,
            @Value("${app.jwt.customer-expiration-ms}") long customerExpirationMs) {
        this.signingKey = Keys.hmacShaKeyFor(signingKeyStr.getBytes(StandardCharsets.UTF_8));
        this.userExpirationMs = userExpirationMs;
        this.customerExpirationMs = customerExpirationMs;
    }

    /** Issue a JWT for an internal user (Consultant / Hotman / Installer). */
    public String issueUserToken(UUID userId, UserRole role, List<FeatureKey> grantedFeatures) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim(CLAIM_ROLE, role.name())
                .claim(CLAIM_FEATURES, grantedFeatures.stream().map(FeatureKey::name).toList())
                .claim(CLAIM_TYPE, TYPE_USER)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + userExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    /** Issue a 7-day JWT for a customer portal session. */
    public String issueCustomerToken(UUID customerId) {
        return Jwts.builder()
                .subject(customerId.toString())
                .claim(CLAIM_ROLE, UserRole.CUSTOMER.name())
                .claim(CLAIM_FEATURES, List.of())
                .claim(CLAIM_TYPE, TYPE_CUSTOMER)
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + customerExpirationMs))
                .signWith(signingKey)
                .compact();
    }

    public Claims parseAndValidate(String token) throws JwtException {
        return Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public UUID extractSubjectAsUuid(Claims claims) {
        return UUID.fromString(claims.getSubject());
    }

    public UserRole extractRole(Claims claims) {
        return UserRole.valueOf(claims.get(CLAIM_ROLE, String.class));
    }

    @SuppressWarnings("unchecked")
    public List<String> extractGrantedFeatures(Claims claims) {
        Object features = claims.get(CLAIM_FEATURES);
        if (features instanceof List<?> list) {
            return list.stream().map(Object::toString).toList();
        }
        return List.of();
    }

    public boolean isCustomerToken(Claims claims) {
        return TYPE_CUSTOMER.equals(claims.get(CLAIM_TYPE, String.class));
    }
}
