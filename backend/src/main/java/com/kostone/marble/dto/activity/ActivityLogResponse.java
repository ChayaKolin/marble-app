package com.kostone.marble.dto.activity;

import com.kostone.marble.domain.activity.ActivityLog;

import java.time.OffsetDateTime;
import java.util.UUID;

public record ActivityLogResponse(
        UUID id,
        String entityType,
        UUID entityId,
        String action,
        String performedByName,
        String customerName,
        String description,
        String reason,
        OffsetDateTime createdAt
) {
    public static ActivityLogResponse from(ActivityLog log) {
        return new ActivityLogResponse(
                log.getId(),
                log.getEntityType().name(),
                log.getEntityId(),
                log.getAction().name(),
                log.getPerformedByName(),
                log.getCustomerName(),
                log.getDescription(),
                log.getReason(),
                log.getCreatedAt()
        );
    }
}
