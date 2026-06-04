package com.kostone.marble.controller;

import com.kostone.marble.dto.order.CreateOrderRequest;
import com.kostone.marble.dto.order.OrderResponse;
import com.kostone.marble.dto.order.TransitionRequest;
import com.kostone.marble.service.order.OrderService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    /** Create — Consultant only. */
    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<OrderResponse> create(@Valid @RequestBody CreateOrderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(orderService.create(req));
    }

    /** List active — Consultant and Hotman. */
    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER')")
    public ResponseEntity<List<OrderResponse>> listActive() {
        return ResponseEntity.ok(orderService.listActive());
    }

    /** List soft-deleted (Trash) — Consultant only. */
    @GetMapping("/trash")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<List<OrderResponse>> listDeleted() {
        return ResponseEntity.ok(orderService.listDeleted());
    }

    /** Get single active order — Consultant and Hotman. */
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER')")
    public ResponseEntity<OrderResponse> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.getById(id));
    }

    /** Soft delete — Consultant only. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<Void> softDelete(@PathVariable UUID id) {
        orderService.softDelete(id);
        return ResponseEntity.noContent().build();
    }

    /** Restore from trash — Consultant only. */
    @PatchMapping("/{id}/restore")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<OrderResponse> restore(@PathVariable UUID id) {
        return ResponseEntity.ok(orderService.restore(id));
    }

    /**
     * Advance order status — Consultant only.
     * Enforces valid-transition table and business gates (deposit, signature).
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<OrderResponse> transition(
            @PathVariable UUID id,
            @Valid @RequestBody TransitionRequest req) {
        return ResponseEntity.ok(orderService.transition(id, req.targetStatus()));
    }
}
