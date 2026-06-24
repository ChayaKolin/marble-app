package com.kostone.marble.domain.auth;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

public interface CustomerPortalTokenRepository extends JpaRepository<CustomerPortalToken, UUID> {

    Optional<CustomerPortalToken> findByTokenHash(String tokenHash);

    @Query("SELECT t FROM CustomerPortalToken t WHERE t.customer.id = :customerId AND t.usedAt IS NULL AND t.expiresAt > :now ORDER BY t.createdAt DESC")
    Optional<CustomerPortalToken> findActiveByCustomerId(UUID customerId, OffsetDateTime now);

    @Modifying
    @Query("UPDATE CustomerPortalToken t SET t.usedAt = :now WHERE t.customer.id = :customerId AND t.usedAt IS NULL")
    void invalidateAllUnusedForCustomer(UUID customerId, OffsetDateTime now);
}
