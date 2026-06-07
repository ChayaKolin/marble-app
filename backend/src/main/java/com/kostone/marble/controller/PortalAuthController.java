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

@RestController
@RequestMapping("/api/v1/portal/auth")
@RequiredArgsConstructor
public class PortalAuthController {

    private final PortalAuthService portalAuthService;

    /** Consultant sends or resends a magic-link to a customer.
     *  Returns the portal URL so the consultant can also share it manually. */
    @PostMapping("/request")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<java.util.Map<String, String>> requestAccess(@Valid @RequestBody PortalAuthRequest request) {
        String portalUrl = portalAuthService.requestPortalAccess(request);
        return ResponseEntity.ok(java.util.Map.of("portalUrl", portalUrl));
    }

    /** Public — customer clicks magic-link. Returns a 7-day JWT on success. */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestParam String token) {
        String jwt = portalAuthService.verifyToken(token);
        return ResponseEntity.ok(Map.of("accessToken", jwt));
    }
}
