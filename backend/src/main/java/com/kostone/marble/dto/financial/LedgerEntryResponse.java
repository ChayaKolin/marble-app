package com.kostone.marble.dto.financial;

import com.kostone.marble.domain.financial.FinancialLedger;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

public record LedgerEntryResponse(
        UUID id,
        UUID orderId,
        BigDecimal amountAllocated,
        int milestoneTier,
        boolean cleared,
        OffsetDateTime clearedAt
) {
    public static LedgerEntryResponse from(FinancialLedger l) {
        return new LedgerEntryResponse(
                l.getId(),
                l.getOrder().getId(),
                l.getAmountAllocated(),
                l.getMilestoneTier(),
                l.isCleared(),
                l.getClearedAt()
        );
    }
}
