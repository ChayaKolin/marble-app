package com.kostone.marble.controller;

import com.kostone.marble.dto.permission.PermissionUpdateRequest;
import com.kostone.marble.dto.permission.PermissionUpdateResponse;
import com.kostone.marble.dto.permission.UserPermissionsResponse;
import com.kostone.marble.service.permission.PermissionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/admin/permissions")
@PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")  // entire controller — Consultant only
@RequiredArgsConstructor
public class PermissionController {

    private final PermissionService permissionService;

    /** Returns current permission state for all features for a user — used to initialise the panel. */
    @GetMapping("/{userId}")
    public ResponseEntity<UserPermissionsResponse> getPermissions(@PathVariable UUID userId) {
        return ResponseEntity.ok(permissionService.getPermissions(userId));
    }

    /** Grants or revokes a single named feature flag for a user. */
    @PutMapping("/{userId}")
    public ResponseEntity<PermissionUpdateResponse> updatePermission(
            @PathVariable UUID userId,
            @Valid @RequestBody PermissionUpdateRequest request) {
        return ResponseEntity.ok(permissionService.updatePermission(userId, request));
    }
}
