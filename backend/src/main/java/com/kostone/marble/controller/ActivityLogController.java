package com.kostone.marble.controller;

import com.kostone.marble.dto.activity.ActivityLogResponse;
import com.kostone.marble.service.activity.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/activity-log")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    /** Recent system activity (order created/status changes/deleted/restored) — Consultant only. */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<List<ActivityLogResponse>> list() {
        return ResponseEntity.ok(activityLogService.listRecent());
    }
}
