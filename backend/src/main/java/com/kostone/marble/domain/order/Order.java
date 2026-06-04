package com.kostone.marble.domain.order;

import com.kostone.marble.domain.customer.Customer;
import com.kostone.marble.domain.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "orders")
@Getter
@Setter
@NoArgsConstructor
public class Order {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false)
    private OrderStatus status = OrderStatus.QUOTATION;

    // Address override: NULL = inherit from customer.site_*
    @Column(name = "site_address", length = 300)
    private String siteAddress;

    @Column(name = "site_city", length = 100)
    private String siteCity;

    @Column(name = "site_floor")
    private Integer siteFloor;

    @Column(name = "site_apt", length = 20)
    private String siteApt;

    // Logistics constraints
    @Column(name = "elevator_width_meters", precision = 4, scale = 2)
    private BigDecimal elevatorWidthMeters;

    @Column(name = "elevator_height_meters", precision = 4, scale = 2)
    private BigDecimal elevatorHeightMeters;

    @Column(name = "crane_required", nullable = false)
    private boolean craneRequired = false;

    // Financial — BigDecimal enforced; ArchUnit rejects float/double in this package
    @Column(name = "total_gross_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalGrossAmount;

    @Column(name = "factory_sla_deadline")
    private OffsetDateTime factorySlaDeadline;

    @Column(name = "notes")
    private String notes;

    @Column(name = "layout_document_url", length = 500)
    private String layoutDocumentUrl;

    @Column(name = "measurements_document_url", length = 500)
    private String measurementsDocumentUrl;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    public boolean isDeleted() {
        return deletedAt != null;
    }

    /** Resolve effective address using COALESCE(order.site_*, customer.site_*). */
    public String effectiveAddress() {
        return siteAddress != null ? siteAddress : customer.getSiteAddress();
    }

    public String effectiveCity() {
        return siteCity != null ? siteCity : customer.getSiteCity();
    }

    public Integer effectiveFloor() {
        return siteFloor != null ? siteFloor : customer.getSiteFloor();
    }

    public String effectiveApt() {
        return siteApt != null ? siteApt : customer.getSiteApt();
    }
}
