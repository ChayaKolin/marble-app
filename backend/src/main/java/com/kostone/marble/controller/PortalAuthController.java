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

    /** Consultant sends or resends a magic-link to a customer. */
    @PostMapping("/request")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<Void> requestAccess(@Valid @RequestBody PortalAuthRequest request) {
        portalAuthService.requestPortalAccess(request);
        return ResponseEntity.noContent().build();
    }

    /** Public — customer clicks magic-link. Returns a 7-day JWT on success. */
    @GetMapping("/verify")
    public ResponseEntity<Map<String, String>> verify(@RequestParam String token) {
        String jwt = portalAuthService.verifyToken(token);
        return ResponseEntity.ok(Map.of("accessToken", jwt));
    }
}
