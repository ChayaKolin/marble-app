package com.kostone.marble.controller;

import com.kostone.marble.dto.calendar.CalendarEventResponse;
import com.kostone.marble.dto.calendar.CreateCalendarEventRequest;
import com.kostone.marble.service.calendar.CalendarService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/calendar/events")
@RequiredArgsConstructor
public class CalendarController {

    private final CalendarService calendarService;

    /**
     * Role-scoped event list:
     * SUPER_ADMIN_OWNER → all events, full financial data
     * FACTORY_MANAGER   → all events, no financial data (role default — no toggle needed)
     * INSTALLER         → own assigned events only
     */
    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN_OWNER','ROLE_FACTORY_MANAGER','ROLE_INSTALLER')")
    public ResponseEntity<List<CalendarEventResponse>> getEvents() {
        return ResponseEntity.ok(calendarService.getEvents());
    }

    /**
     * Create event — SUPER_ADMIN_OWNER always, or FACTORY_MANAGER with MANAGE_CALENDAR.
     * Permission enforcement is inside CalendarService.assertCanManageCalendar().
     */
    @PostMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN_OWNER','ROLE_FACTORY_MANAGER')")
    public ResponseEntity<CalendarEventResponse> create(@Valid @RequestBody CreateCalendarEventRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(calendarService.createEvent(req));
    }

    /** Update event — same write permission guard. */
    @PutMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN_OWNER','ROLE_FACTORY_MANAGER')")
    public ResponseEntity<CalendarEventResponse> update(
            @PathVariable UUID id,
            @Valid @RequestBody CreateCalendarEventRequest req) {
        return ResponseEntity.ok(calendarService.updateEvent(id, req));
    }

    /** Delete event — same write permission guard. */
    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN_OWNER','ROLE_FACTORY_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable UUID id) {
        calendarService.deleteEvent(id);
        return ResponseEntity.noContent().build();
    }
}
