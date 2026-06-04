package com.kostone.marble.controller;

import com.kostone.marble.dto.portal.PortalOrderResponse;
import com.kostone.marble.service.portal.PortalOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/portal/orders")
@PreAuthorize("hasRole('CUSTOMER')")
@RequiredArgsConstructor
public class PortalOrderController {

    private final PortalOrderService portalOrderService;

    /**
     * Returns all active orders for the authenticated customer.
     * Scoped to JWT's customer_id — cross-customer access is impossible.
     */
    @GetMapping
    public ResponseEntity<List<PortalOrderResponse>> getMyOrders() {
        return ResponseEntity.ok(portalOrderService.getMyOrders());
    }

    /**
     * Returns a single order, verified to belong to the authenticated customer.
     * Returns 404 if not found or belonging to a different customer.
     */
    @GetMapping("/{orderId}")
    public ResponseEntity<PortalOrderResponse> getMyOrder(@PathVariable UUID orderId) {
        return ResponseEntity.ok(portalOrderService.getMyOrder(orderId));
    }
}
