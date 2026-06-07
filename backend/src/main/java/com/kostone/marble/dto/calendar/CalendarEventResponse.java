package com.kostone.marble.dto.calendar;

import com.kostone.marble.domain.calendar.CalendarEvent;
import com.kostone.marble.domain.calendar.CalendarEventType;
import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.UUID;

public record CalendarEventResponse(
        UUID id,
        String title,
        CalendarEventType eventType,
        // Order context — always visible
        UUID relatedOrderId,
        String customerName,
        String effectiveAddress,
        String effectiveCity,
        Integer effectiveFloor,
        String effectiveApt,
        String elevatorNotes,      // access constraints summary
        OrderStatus orderStatus,
        // Assignee — always visible
        UUID assignedToUserId,
        String assignedToUserName,
        // Measurer — always visible (booked from the roster, e.g. for MEASUREMENT events)
        UUID measurerId,
        String measurerName,
        String measurerPhone,
        // Timing — always visible
        LocalDate eventDate,
        LocalTime startTime,
        LocalTime endTime,
        String notes,
        // Financial — Consultant only (null for Hotman/Installer)
        BigDecimal totalGrossAmount,
        String orderNotes
) {
    /** Full response for SUPER_ADMIN_OWNER — all fields populated. */
    public static CalendarEventResponse fullFrom(CalendarEvent e) {
        return buildFrom(e, true);
    }

    /** Restricted response for FACTORY_MANAGER / INSTALLER — financial fields null. */
    public static CalendarEventResponse restrictedFrom(CalendarEvent e) {
        return buildFrom(e, false);
    }

    private static CalendarEventResponse buildFrom(CalendarEvent e, boolean includeFinancial) {
        Order order = e.getRelatedOrder();
        return new CalendarEventResponse(
                e.getId(),
                e.getTitle(),
                e.getEventType(),
                order != null ? order.getId() : null,
                order != null ? order.getCustomer().getFullName() : null,
                order != null ? order.effectiveAddress() : null,
                order != null ? order.effectiveCity() : null,
                order != null ? order.effectiveFloor() : null,
                order != null ? order.effectiveApt() : null,
                order != null ? buildElevatorNotes(order) : null,
                order != null ? order.getStatus() : null,
                e.getAssignedToUser() != null ? e.getAssignedToUser().getId() : null,
                e.getAssignedToUser() != null ? e.getAssignedToUser().getFullName() : null,
                e.getMeasurer() != null ? e.getMeasurer().getId() : null,
                e.getMeasurer() != null ? e.getMeasurer().getFullName() : null,
                e.getMeasurer() != null ? e.getMeasurer().getPhoneNumber() : null,
                e.getEventDate(),
                e.getStartTime(),
                e.getEndTime(),
                e.getNotes(),
                includeFinancial && order != null ? order.getTotalGrossAmount() : null,
                includeFinancial && order != null ? order.getNotes() : null
        );
    }

    private static String buildElevatorNotes(Order order) {
        if (order.getElevatorWidthMeters() == null) return null;
        return String.format("מעלית: %.1fm × %.1fm%s",
                order.getElevatorWidthMeters(),
                order.getElevatorHeightMeters() != null ? order.getElevatorHeightMeters() : 0,
                order.isCraneRequired() ? " | נדרש מנוף (על חשבון הלקוח)" : "");
    }
}
