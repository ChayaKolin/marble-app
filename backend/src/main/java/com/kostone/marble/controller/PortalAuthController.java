package com.kostone.marble.controller;

import com.kostone.marble.dto.auth.LoginResponse;
import com.kostone.marble.dto.auth.PortalAuthRequest;
import com.kostone.marble.service.auth.PortalAuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portal/auth")
@RequiredArgsConstructor
public class PortalAuthController {

    private final PortalAuthService portalAuthService;

    /** Consultant sends or resends a magic-link to a customer.
     *  Returns the portal URL so the consultant can also share it manually,
     *  along with whether delivery via the chosen channel actually succeeded. */
    @PostMapping("/request")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<java.util.Map<String, Object>> requestAccess(@Valid @RequestBody PortalAuthRequest request) {
        var result = portalAuthService.requestPortalAccess(request);
        return ResponseEntity.ok(java.util.Map.of("portalUrl", result.portalUrl(), "delivered", result.delivered()));
    }

    /** Consultant — fetch the current active portal link for a customer (if any). */
    @GetMapping("/current-link")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<Map<String, String>> currentLink(@RequestParam UUID customerId) {
        return portalAuthService.getCurrentLink(customerId)
                .map(url -> ResponseEntity.ok(Map.of("portalUrl", url)))
                .orElse(ResponseEntity.noContent().build());
    }

    /** Public — customer clicks magic-link. Returns a 7-day JWT on success. */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestParam String token) {
        String jwt = portalAuthService.verifyToken(token);
        return ResponseEntity.ok(Map.of("accessToken", jwt));
    }
}
