package com.kostone.marble.controller;

import com.kostone.marble.dto.logistics.CreateLogisticsRequest;
import com.kostone.marble.dto.logistics.LogisticsAssignmentResponse;
import com.kostone.marble.service.logistics.LogisticsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/logistics")
@RequiredArgsConstructor
public class LogisticsController {

    private final LogisticsService logisticsService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER')")
    public ResponseEntity<List<LogisticsAssignmentResponse>> list(@PathVariable UUID orderId) {
        return ResponseEntity.ok(logisticsService.listByOrder(orderId));
    }

    /** Create dispatch assignment — auto-creates calendar event via Spring event. */
    @PostMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER')")
    public ResponseEntity<LogisticsAssignmentResponse> create(
            @PathVariable UUID orderId,
            @Valid @RequestBody CreateLogisticsRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(logisticsService.createAssignment(orderId, req));
    }

    /** Mark assignment complete. */
    @PatchMapping("/{assignmentId}/complete")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER','INSTALLER')")
    public ResponseEntity<LogisticsAssignmentResponse> complete(
            @PathVariable UUID orderId,
            @PathVariable UUID assignmentId) {
        return ResponseEntity.ok(logisticsService.markComplete(orderId, assignmentId));
    }
}
