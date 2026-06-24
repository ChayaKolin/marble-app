package com.kostone.marble.dto.portal;

import java.math.BigDecimal;

public record PaymentMilestoneStatus(
        int tier,
        String labelHe,
        BigDecimal amount,
        boolean cleared
) {
    public static PaymentMilestoneStatus of(int tier, BigDecimal amount, boolean cleared) {
        String label = tier == 1 ? "תשלום ששולם עד כה:" : "יתרה לתשלום";
        return new PaymentMilestoneStatus(tier, label, amount, cleared);
    }
}
