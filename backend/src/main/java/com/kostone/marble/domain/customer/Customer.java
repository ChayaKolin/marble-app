package com.kostone.marble.domain.customer;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "customers")
@Getter
@Setter
@NoArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "full_name", nullable = false, length = 150)
    private String fullName;

    @Column(name = "phone_number", nullable = false, length = 30)
    private String phoneNumber;

    @Column(name = "email_address", nullable = false, length = 150)
    private String emailAddress;

    @Column(name = "site_address", nullable = false, length = 300)
    private String siteAddress;

    @Column(name = "site_city", nullable = false, length = 100)
    private String siteCity;

    @Column(name = "site_floor")
    private Integer siteFloor;

    @Column(name = "site_apt", length = 20)
    private String siteApt;

    @Column(name = "architect_name", length = 150)
    private String architectName;

    @Column(name = "architect_phone", length = 30)
    private String architectPhone;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "deleted_at")
    private OffsetDateTime deletedAt;

    /** Active/inactive toggle — independent of soft-delete. Inactive customers are hidden from new-order selection. */
    @Column(name = "is_active", nullable = false)
    private boolean active = true;

    public boolean isDeleted() {
        return deletedAt != null;
    }
}
