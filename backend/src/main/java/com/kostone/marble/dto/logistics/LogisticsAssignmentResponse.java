package com.kostone.marble.dto.logistics;

import com.kostone.marble.domain.logistics.LogisticsAssignment;

import java.time.OffsetDateTime;
import java.util.UUID;

public record LogisticsAssignmentResponse(
        UUID id,
        UUID orderId,
        UUID installerUserId,
        String installerFullName,
        String installerPhone,
        OffsetDateTime deliveryScheduledDate,
        boolean primary,
        String installerNotes,
        boolean completed
) {
    public static LogisticsAssignmentResponse from(LogisticsAssignment a) {
        return new LogisticsAssignmentResponse(
                a.getId(),
                a.getOrder().getId(),
                a.getInstallerUser().getId(),
                a.getInstallerUser().getFullName(),
                a.getInstallerUser().getPhoneNumber(),
                a.getDeliveryScheduledDate(),
                a.isPrimary(),
                a.getInstallerNotes(),
                a.isCompleted()
        );
    }
}
