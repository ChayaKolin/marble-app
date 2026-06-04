package com.kostone.marble.domain.event;

import com.kostone.marble.domain.logistics.LogisticsAssignment;

/**
 * Published after a LogisticsAssignment is persisted.
 * Consumed by CalendarEventCreationListener to auto-create the calendar entry.
 */
public record LogisticsAssignmentCreatedEvent(LogisticsAssignment assignment) {}
