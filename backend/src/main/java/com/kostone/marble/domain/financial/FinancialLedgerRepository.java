package com.kostone.marble.domain.financial;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public interface FinancialLedgerRepository extends JpaRepository<FinancialLedger, UUID> {

    List<FinancialLedger> findByOrderId(UUID orderId);

    /** Sum of all cleared amounts for a given order and milestone tier. */
    @Query("SELECT COALESCE(SUM(l.amountAllocated), 0) FROM FinancialLedger l " +
           "WHERE l.order.id = :orderId AND l.milestoneTier = :tier AND l.cleared = true")
    BigDecimal sumClearedAmountByOrderAndTier(UUID orderId, int tier);
}
