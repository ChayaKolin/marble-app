package com.kostone.marble.controller;

import com.kostone.marble.dto.signature.CreateSignatureRequest;
import com.kostone.marble.dto.signature.SignatureResponse;
import com.kostone.marble.service.signature.DigitalSignatureService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/signatures")
@RequiredArgsConstructor
public class DigitalSignatureController {

    private final DigitalSignatureService signatureService;

    /**
     * List signatures for an order — Consultant only (contains audit data).
     */
    @GetMapping
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<List<SignatureResponse>> list(@PathVariable UUID orderId) {
        return ResponseEntity.ok(signatureService.listByOrder(orderId));
    }

    /**
     * Create a digital signature on an order.
     * Accessible by: CUSTOMER (portal), INSTALLER (mobile), SUPER_ADMIN_OWNER.
     * Category-to-role enforcement is handled inside DigitalSignatureService.
     */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','CUSTOMER','INSTALLER')")
    public ResponseEntity<SignatureResponse> create(
            @PathVariable UUID orderId,
            @Valid @RequestBody CreateSignatureRequest req,
            HttpServletRequest httpRequest) {
        String ip = resolveClientIp(httpRequest);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(signatureService.create(orderId, req, ip));
    }

    private String resolveClientIp(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
