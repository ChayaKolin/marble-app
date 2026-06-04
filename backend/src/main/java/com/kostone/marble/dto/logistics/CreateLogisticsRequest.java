package com.kostone.marble.dto.logistics;

import jakarta.validation.constraints.NotNull;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CreateLogisticsRequest(
        @NotNull UUID installerUserId,
        @NotNull OffsetDateTime deliveryScheduledDate,
        boolean primary,   // true = main installation, false = return visit
        String installerNotes
) {}
