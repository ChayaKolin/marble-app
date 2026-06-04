package com.kostone.marble.domain.financial;

import com.kostone.marble.domain.order.Order;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "financial_ledger")
@Getter
@Setter
@NoArgsConstructor
public class FinancialLedger {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "amount_allocated", nullable = false, precision = 12, scale = 2)
    private BigDecimal amountAllocated;

    /** 1 = 20% Deposit gate, 2 = 80% Balance confirmation. */
    @Column(name = "milestone_tier", nullable = false)
    private int milestoneTier;

    @Column(name = "is_cleared", nullable = false)
    private boolean cleared = false;

    @Column(name = "cleared_at")
    private OffsetDateTime clearedAt;
}
