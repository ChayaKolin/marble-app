package com.kostone.marble.service.calendar;

import com.kostone.marble.domain.calendar.CalendarEvent;
import com.kostone.marble.domain.calendar.CalendarEventRepository;
import com.kostone.marble.domain.calendar.CalendarEventType;
import com.kostone.marble.domain.event.LogisticsAssignmentCreatedEvent;
import com.kostone.marble.domain.logistics.LogisticsAssignment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Auto-creates a calendar_events row when a logistics_assignment is inserted.
 * is_primary = TRUE  → INSTALLATION event
 * is_primary = FALSE → SITE_VISIT event (return visit / PENDING_REPAIR cycle)
 *
 * Runs AFTER_COMMIT so the calendar event is only created if the assignment
 * transaction committed successfully.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class CalendarEventCreationListener {

    private final CalendarEventRepository calendarEventRepository;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void onLogisticsAssignmentCreated(LogisticsAssignmentCreatedEvent event) {
        LogisticsAssignment assignment = event.assignment();

        CalendarEventType type = assignment.isPrimary()
                ? CalendarEventType.INSTALLATION
                : CalendarEventType.SITE_VISIT;

        String customerName = assignment.getOrder().getCustomer().getFullName();
        String title = (type == CalendarEventType.INSTALLATION ? "התקנה" : "ביקור חוזר") + " — " + customerName;

        CalendarEvent calEvent = new CalendarEvent();
        calEvent.setTitle(title);
        calEvent.setEventType(type);
        calEvent.setRelatedOrder(assignment.getOrder());
        calEvent.setRelatedLogistics(assignment);
        calEvent.setAssignedToUser(assignment.getInstallerUser());
        calEvent.setEventDate(assignment.getDeliveryScheduledDate().toLocalDate());
        calEvent.setStartTime(assignment.getDeliveryScheduledDate().toLocalTime());
        calEvent.setCreatedBy(assignment.getInstallerUser()); // set to installer as proxy; refined in Group 10

        calendarEventRepository.save(calEvent);
        log.info("Auto-created {} calendar event for assignment {}", type, assignment.getId());
    }
}
