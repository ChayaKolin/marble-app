package com.kostone.marble.controller;

import com.kostone.marble.dto.analytics.AnalyticsDashboardResponse;
import com.kostone.marble.service.analytics.AnalyticsService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/analytics")
@PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
@RequiredArgsConstructor
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    /** Full analytics dashboard payload — Consultant only. */
    @GetMapping("/dashboard")
    public ResponseEntity<AnalyticsDashboardResponse> dashboard() {
        return ResponseEntity.ok(analyticsService.buildDashboard());
    }
}
