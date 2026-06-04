package com.kostone.marble.domain.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface SinkSpecificationRepository extends JpaRepository<SinkSpecification, UUID> {
    List<SinkSpecification> findByOrderId(UUID orderId);
}
