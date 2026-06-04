package com.kostone.marble.dto.order;

import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record OrderResponse(
        UUID id,
        UUID customerId,
        String customerFullName,
        OrderStatus status,
        // Effective address (COALESCE applied)
        String effectiveAddress,
        String effectiveCity,
        Integer effectiveFloor,
        String effectiveApt,
        // Raw override fields (null = inheriting from customer)
        String overrideAddress,
        String overrideCity,
        Integer overrideFloor,
        String overrideApt,
        // Logistics
        BigDecimal elevatorWidthMeters,
        BigDecimal elevatorHeightMeters,
        boolean craneRequired,
        // Financial
        BigDecimal totalGrossAmount,
        OffsetDateTime factorySlaDeadline,
        String notes,
        OffsetDateTime createdAt,
        OffsetDateTime deletedAt
) {
    public static OrderResponse from(Order o) {
        return new OrderResponse(
                o.getId(),
                o.getCustomer().getId(),
                o.getCustomer().getFullName(),
                o.getStatus(),
                // COALESCE effective address
                o.effectiveAddress(),
                o.effectiveCity(),
                o.effectiveFloor(),
                o.effectiveApt(),
                // Raw overrides
                o.getSiteAddress(),
                o.getSiteCity(),
                o.getSiteFloor(),
                o.getSiteApt(),
                o.getElevatorWidthMeters(),
                o.getElevatorHeightMeters(),
                o.isCraneRequired(),
                o.getTotalGrossAmount(),
                o.getFactorySlaDeadline(),
                o.getNotes(),
                o.getCreatedAt(),
                o.getDeletedAt()
        );
    }
}
