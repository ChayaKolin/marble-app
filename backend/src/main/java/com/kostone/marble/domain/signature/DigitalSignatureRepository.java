package com.kostone.marble.domain.signature;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface DigitalSignatureRepository extends JpaRepository<DigitalSignature, UUID> {

    boolean existsByOrderIdAndCategory(UUID orderId, SignatureCategory category);

    java.util.List<DigitalSignature> findByOrderId(UUID orderId);
}
