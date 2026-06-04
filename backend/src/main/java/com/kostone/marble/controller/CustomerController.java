package com.kostone.marble.controller;

import com.kostone.marble.dto.customer.CreateCustomerRequest;
import com.kostone.marble.dto.customer.CustomerResponse;
import com.kostone.marble.service.customer.CustomerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/customers")
@RequiredArgsConstructor
public class CustomerController {

    private final CustomerService customerService;

    /** Create — Consultant only. */
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<CustomerResponse> create(@Valid @RequestBody CreateCustomerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(customerService.create(req));
    }

    /** List active (non-deleted) — Consultant and Hotman. */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER')")
    public ResponseEntity<List<CustomerResponse>> listActive() {
        return ResponseEntity.ok(customerService.listActive());
    }

    /** List soft-deleted (Trash) — Consultant only. */
    @GetMapping("/trash")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<List<CustomerResponse>> listDeleted() {
        return ResponseEntity.ok(customerService.listDeleted());
    }

    /** Get single active customer — Consultant and Hotman. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER')")
    public ResponseEntity<CustomerResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.getById(id));
    }

    /** Soft delete — Consultant only. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<Void> softDelete(@PathVariable UUID id) {
        customerService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    /** Restore from trash — Consultant only. */
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<CustomerResponse> restore(@PathVariable UUID id) {
        return ResponseEntity.ok(customerService.restore(id));
    }
}
