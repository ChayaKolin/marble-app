package com.kostone.marble.domain.calendar;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface CalendarEventRepository extends JpaRepository<CalendarEvent, UUID> {

    /** All events — Consultant view. */
    @Query("SELECT e FROM CalendarEvent e LEFT JOIN FETCH e.relatedOrder " +
           "LEFT JOIN FETCH e.assignedToUser ORDER BY e.eventDate ASC, e.startTime ASC NULLS LAST")
    List<CalendarEvent> findAllOrderedByDate();

    /** Installer personal slice — own assignments only. */
    @Query("SELECT e FROM CalendarEvent e LEFT JOIN FETCH e.relatedOrder " +
           "WHERE e.assignedToUser.id = :userId ORDER BY e.eventDate ASC")
    List<CalendarEvent> findByAssignedUserId(UUID userId);
}
