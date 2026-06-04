package com.kostone.marble.service.auth;

import com.kostone.marble.domain.auth.CustomerPortalToken;
import com.kostone.marble.domain.auth.CustomerPortalTokenRepository;
import com.kostone.marble.domain.customer.Customer;
import com.kostone.marble.domain.customer.CustomerRepository;
import com.kostone.marble.dto.auth.PortalAuthRequest;
import com.kostone.marble.security.JwtUtil;
import com.kostone.marble.service.notification.NotificationPort;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.OffsetDateTime;
import java.util.Base64;
import java.util.HexFormat;

@Service
@RequiredArgsConstructor
public class PortalAuthService {

    private static final int TOKEN_BYTES = 32;
    private static final long EMAIL_TTL_HOURS = 24;
    private static final long WHATSAPP_TTL_HOURS = 2;

    private final CustomerRepository customerRepository;
    private final CustomerPortalTokenRepository tokenRepository;
    private final JwtUtil jwtUtil;
    private final NotificationPort notificationPort;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    /**
     * Generates a one-time magic-link token, invalidates previous unused tokens,
     * stores the SHA-256 hash, and delivers the plain token to the customer.
     * Called by Consultant only (enforced at controller layer).
     */
    @Transactional
    public void requestPortalAccess(PortalAuthRequest request) {
        Customer customer = customerRepository.findByIdAndDeletedAtIsNull(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        // Invalidate all previous unused tokens for this customer.
        tokenRepository.invalidateAllUnusedForCustomer(customer.getId(), OffsetDateTime.now());

        // Generate a cryptographically secure random token.
        byte[] rawBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(rawBytes);
        String plainToken = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);
        String tokenHash = sha256Hex(plainToken);

        // Determine expiry based on delivery channel.
        long ttlHours = "WHATSAPP".equals(request.channel()) ? WHATSAPP_TTL_HOURS : EMAIL_TTL_HOURS;
        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(ttlHours);

        CustomerPortalToken token = new CustomerPortalToken();
        token.setCustomer(customer);
        token.setTokenHash(tokenHash);
        token.setDeliveryChannel(request.channel());
        token.setExpiresAt(expiresAt);
        tokenRepository.save(token);

        String magicLink = baseUrl + "/portal/auth?token=" + plainToken;

        if ("WHATSAPP".equals(request.channel())) {
            notificationPort.sendMagicLinkWhatsApp(customer.getPhoneNumber(), customer.getFullName(), magicLink);
        } else {
            notificationPort.sendMagicLinkEmail(customer.getEmailAddress(), customer.getFullName(), magicLink);
        }
    }

    /**
     * Validates the plain token: hashes it, looks up by hash, checks expiry and used_at.
     * On success: marks token used and returns a 7-day customer JWT.
     * On any failure: returns 401 (no enumeration of why).
     */
    @Transactional
    public String verifyToken(String plainToken) {
        String hash = sha256Hex(plainToken);

        CustomerPortalToken token = tokenRepository.findByTokenHash(hash)
                .filter(CustomerPortalToken::isValid)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));

        token.setUsedAt(OffsetDateTime.now());
        tokenRepository.save(token);

        return jwtUtil.issueCustomerToken(token.getCustomer().getId());
    }

    private static String sha256Hex(String input) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 unavailable", e);
        }
    }
}
