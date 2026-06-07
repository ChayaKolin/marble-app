package com.kostone.marble.controller;

import com.kostone.marble.dto.measurer.CreateMeasurerRequest;
import com.kostone.marble.dto.measurer.MeasurerResponse;
import com.kostone.marble.service.measurer.MeasurerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/measurers")
@RequiredArgsConstructor
public class MeasurerController {

    private final MeasurerService measurerService;

    /** List the measurer roster — Consultant only (used when booking a measurement appointment). */
    @GetMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<List<MeasurerResponse>> listActive() {
        return ResponseEntity.ok(measurerService.listActive());
    }

    /** Add a new measurer to the roster — Consultant only. */
    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<MeasurerResponse> create(@Valid @RequestBody CreateMeasurerRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(measurerService.create(req));
    }
}
