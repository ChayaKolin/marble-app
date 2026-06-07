package com.kostone.marble.dto.calendar;

import com.kostone.marble.domain.calendar.CalendarEventType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CreateCalendarEventRequest(
        @NotBlank @Size(max = 200) String title,
        @NotNull CalendarEventType eventType,
        UUID relatedOrderId,       // optional
        UUID assignedToUserId,     // optional
        UUID measurerId,           // optional — set on MEASUREMENT events booked from the roster
        @NotNull LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        String notes
) {}
