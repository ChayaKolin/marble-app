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
    private static final long TOKEN_TTL_HOURS = 7 * 24; // 7 days — link stays valid until customer signs

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
     *
     * The token is persisted before delivery is attempted, so the link is valid
     * even if delivery fails — a delivery failure (e.g. SMTP/WhatsApp outage) is
     * reported via {@code delivered} but does not fail the request, since the
     * Consultant can still copy and share the link manually.
     */
    @Transactional
    public PortalAccessResult requestPortalAccess(PortalAuthRequest request) {
        Customer customer = customerRepository.findByIdAndDeletedAtIsNull(request.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        String magicLink = issueMagicLink(customer, request.channel());

        boolean delivered = "WHATSAPP".equals(request.channel())
                ? notificationPort.sendMagicLinkWhatsApp(customer.getPhoneNumber(), customer.getFullName(), magicLink)
                : notificationPort.sendMagicLinkEmail(customer.getEmailAddress(), customer.getFullName(), magicLink);

        return new PortalAccessResult(magicLink, delivered);
    }

    /** Result of a magic-link request: the link itself, and whether delivery succeeded. */
    public record PortalAccessResult(String portalUrl, boolean delivered) {}

    /**
     * Issues a fresh one-time magic-link token for the given customer (invalidating
     * any previous unused tokens) and returns the portal URL — without sending any
     * notification. Used by other services (e.g. layout-ready notifications) that
     * need to give the customer an authenticated link into the portal.
     */
    @Transactional
    public String issueMagicLink(Customer customer, String channel) {
        // Invalidate all previous unused tokens for this customer.
        tokenRepository.invalidateAllUnusedForCustomer(customer.getId(), OffsetDateTime.now());

        // Generate a cryptographically secure random token.
        byte[] rawBytes = new byte[TOKEN_BYTES];
        secureRandom.nextBytes(rawBytes);
        String plainToken = Base64.getUrlEncoder().withoutPadding().encodeToString(rawBytes);
        String tokenHash = sha256Hex(plainToken);

        OffsetDateTime expiresAt = OffsetDateTime.now().plusHours(TOKEN_TTL_HOURS);
        String portalUrl = baseUrl + "/portal/auth?token=" + plainToken;

        CustomerPortalToken token = new CustomerPortalToken();
        token.setCustomer(customer);
        token.setTokenHash(tokenHash);
        token.setDeliveryChannel(channel);
        token.setExpiresAt(expiresAt);
        token.setPortalUrl(portalUrl);
        tokenRepository.save(token);

        return portalUrl;
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

        // Token is NOT marked used here — customer can reopen the link multiple times
        // until they sign. The token is invalidated only when a new one is issued.
        return jwtUtil.issueCustomerToken(token.getCustomer().getId());
    }

    /** Returns the currently active portal URL for a customer, if one exists. */
    @Transactional(readOnly = true)
    public java.util.Optional<String> getCurrentLink(java.util.UUID customerId) {
        return tokenRepository.findActiveByCustomerId(customerId, OffsetDateTime.now())
                .map(CustomerPortalToken::getPortalUrl);
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
