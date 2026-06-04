package com.kostone.marble.dto.customer;

import com.kostone.marble.domain.customer.Customer;

import java.time.OffsetDateTime;
import java.util.UUID;

public record CustomerResponse(
        UUID id,
        String fullName,
        String phoneNumber,
        String emailAddress,
        String siteAddress,
        String siteCity,
        Integer siteFloor,
        String siteApt,
        String architectName,
        String architectPhone,
        OffsetDateTime createdAt,
        OffsetDateTime deletedAt
) {
    public static CustomerResponse from(Customer c) {
        return new CustomerResponse(
                c.getId(), c.getFullName(), c.getPhoneNumber(), c.getEmailAddress(),
                c.getSiteAddress(), c.getSiteCity(), c.getSiteFloor(), c.getSiteApt(),
                c.getArchitectName(), c.getArchitectPhone(), c.getCreatedAt(), c.getDeletedAt()
        );
    }
}
