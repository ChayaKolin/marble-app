package com.kostone.marble.controller;

import com.kostone.marble.dto.financial.CreatePaymentRequest;
import com.kostone.marble.dto.financial.LedgerEntryResponse;
import com.kostone.marble.service.financial.FinancialLedgerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/payments")
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
@RequiredArgsConstructor
public class FinancialLedgerController {

    private final FinancialLedgerService ledgerService;

    @GetMapping
    public ResponseEntity<List<LedgerEntryResponse>> list(@PathVariable UUID orderId) {
        return ResponseEntity.ok(ledgerService.listByOrder(orderId));
    }

    /** Create a new payment ledger entry (e.g., record the 20% deposit). */
    @PostMapping
    public ResponseEntity<LedgerEntryResponse> create(
            @PathVariable UUID orderId,
            @Valid @RequestBody CreatePaymentRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ledgerService.createEntry(orderId, req));
    }

    /** Confirm (clear) a payment — marks it as received and timestamped. */
    @PutMapping("/{ledgerId}/clear")
    public ResponseEntity<LedgerEntryResponse> clear(
            @PathVariable UUID orderId,
            @PathVariable UUID ledgerId) {
        return ResponseEntity.ok(ledgerService.clearEntry(orderId, ledgerId));
    }
}
