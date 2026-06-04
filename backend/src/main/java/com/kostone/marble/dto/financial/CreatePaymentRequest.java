package com.kostone.marble.dto.financial;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

import java.math.BigDecimal;

public record CreatePaymentRequest(
        /**
         * Amount allocated to this ledger entry.
         * @Digits enforces max 12 integer + 2 fraction digits — matches NUMERIC(12,2) in DB.
         * Jackson deserializes JSON numbers as BigDecimal (see JacksonConfig) so no
         * floating-point precision loss occurs before this validation runs.
         */
        @NotNull
        @DecimalMin(value = "0.01", message = "סכום חייב להיות גדול מאפס")
        @Digits(integer = 12, fraction = 2, message = "סכום חורג מדיוק מותר")
        BigDecimal amountAllocated,

        /**
         * 1 = 20% deposit milestone, 2 = 80% balance milestone.
         */
        @NotNull @Min(1) @Max(2)
        Integer milestoneTier
) {}
