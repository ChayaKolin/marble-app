package com.kostone.marble.dto.order;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateOrderRequest(
        @NotNull UUID customerId,
        @NotNull @DecimalMin("0.01") BigDecimal totalGrossAmount,
        // Address override — NULL means inherit from customer
        @Size(max = 300) String siteAddress,
        @Size(max = 100) String siteCity,
        Integer siteFloor,
        @Size(max = 20) String siteApt,
        // Logistics access
        BigDecimal elevatorWidthMeters,
        BigDecimal elevatorHeightMeters,
        Boolean craneRequired,
        OffsetDateTime factorySlaDeadline,
        String notes
) {}
