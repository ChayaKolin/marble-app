package com.kostone.marble.service.calendar;

import com.kostone.marble.domain.calendar.CalendarEvent;
import com.kostone.marble.domain.calendar.CalendarEventRepository;
import com.kostone.marble.domain.measurer.MeasurerRepository;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.user.FeatureKey;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.domain.user.UserRole;
import com.kostone.marble.dto.calendar.CalendarEventResponse;
import com.kostone.marble.dto.calendar.CreateCalendarEventRequest;
import com.kostone.marble.security.MarbleUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CalendarService {

    private final CalendarEventRepository calendarEventRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final MeasurerRepository measurerRepository;

    // -------------------------------------------------------------------------
    // Task 10.1 — GET: role-scoped event list
    // -------------------------------------------------------------------------

    @Transactional(readOnly = true)
    public List<CalendarEventResponse> getEvents() {
        MarbleUserDetails principal = currentPrincipal();

        return switch (principal.getRole()) {
            case SUPER_ADMIN_OWNER ->
                calendarEventRepository.findAllOrderedByDate()
                        .stream().map(CalendarEventResponse::fullFrom).toList();

            case FACTORY_MANAGER ->
                calendarEventRepository.findAllOrderedByDate()
                        .stream().map(CalendarEventResponse::restrictedFrom).toList();

            case INSTALLER ->
                calendarEventRepository.findByAssignedUserId(principal.getUserId())
                        .stream().map(CalendarEventResponse::restrictedFrom).toList();

            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "אין גישה ללוח שנה");
        };
    }

    // -------------------------------------------------------------------------
    // Task 10.2 — POST: create event (requires write permission)
    // -------------------------------------------------------------------------

    @Transactional
    public CalendarEventResponse createEvent(CreateCalendarEventRequest req) {
        assertCanManageCalendar();
        User creator = resolveCurrentUser();

        CalendarEvent event = new CalendarEvent();
        event.setTitle(req.title());
        event.setEventType(req.eventType());
        event.setEventDate(req.eventDate());
        event.setStartTime(req.startTime());
        event.setEndTime(req.endTime());
        event.setNotes(req.notes());
        event.setCreatedBy(creator);

        if (req.relatedOrderId() != null) {
            orderRepository.findByIdAndDeletedAtIsNull(req.relatedOrderId())
                    .ifPresent(event::setRelatedOrder);
        }
        if (req.assignedToUserId() != null) {
            userRepository.findById(req.assignedToUserId())
                    .ifPresent(event::setAssignedToUser);
        }
        if (req.measurerId() != null) {
            measurerRepository.findByIdAndDeletedAtIsNull(req.measurerId())
                    .ifPresent(event::setMeasurer);
        }

        return CalendarEventResponse.fullFrom(calendarEventRepository.save(event));
    }

    // -------------------------------------------------------------------------
    // Task 10.3 — PUT: update event
    // -------------------------------------------------------------------------

    @Transactional
    public CalendarEventResponse updateEvent(UUID id, CreateCalendarEventRequest req) {
        assertCanManageCalendar();
        CalendarEvent event = calendarEventRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found"));

        event.setTitle(req.title());
        event.setEventType(req.eventType());
        event.setEventDate(req.eventDate());
        event.setStartTime(req.startTime());
        event.setEndTime(req.endTime());
        event.setNotes(req.notes());

        if (req.relatedOrderId() != null) {
            orderRepository.findByIdAndDeletedAtIsNull(req.relatedOrderId())
                    .ifPresent(event::setRelatedOrder);
        }
        if (req.assignedToUserId() != null) {
            userRepository.findById(req.assignedToUserId())
                    .ifPresent(event::setAssignedToUser);
        }
        if (req.measurerId() != null) {
            measurerRepository.findByIdAndDeletedAtIsNull(req.measurerId())
                    .ifPresent(event::setMeasurer);
        }

        return CalendarEventResponse.fullFrom(calendarEventRepository.save(event));
    }

    // -------------------------------------------------------------------------
    // Task 10.3 — DELETE: remove event
    // -------------------------------------------------------------------------

    @Transactional
    public void deleteEvent(UUID id) {
        assertCanManageCalendar();
        if (!calendarEventRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Event not found");
        }
        calendarEventRepository.deleteById(id);
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Write access: SUPER_ADMIN_OWNER always allowed.
     * FACTORY_MANAGER allowed only if MANAGE_CALENDAR feature is granted.
     */
    private void assertCanManageCalendar() {
        MarbleUserDetails principal = currentPrincipal();
        if (principal.getRole() == UserRole.SUPER_ADMIN_OWNER) return;
        if (principal.getGrantedFeatures().contains(FeatureKey.MANAGE_CALENDAR)) return;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "נדרשת הרשאת ניהול לוח שנה");
    }

    private MarbleUserDetails currentPrincipal() {
        return (MarbleUserDetails)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private User resolveCurrentUser() {
        return userRepository.findById(currentPrincipal().getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "User not found"));
    }
}
