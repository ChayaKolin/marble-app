package com.kostone.marble.domain.logistics;

import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "logistics_assignments")
@Getter
@Setter
@NoArgsConstructor
public class LogisticsAssignment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "installer_user_id", nullable = false)
    private User installerUser;

    @Column(name = "delivery_scheduled_date", nullable = false)
    private OffsetDateTime deliveryScheduledDate;

    /** TRUE = main installation (triggers 80% payment on completion).
     *  FALSE = return visit (PENDING_REPAIR cycle, no payment trigger). */
    @Column(name = "is_primary", nullable = false)
    private boolean primary = true;

    @Column(name = "installer_notes")
    private String installerNotes;

    @Column(name = "is_completed", nullable = false)
    private boolean completed = false;
}
