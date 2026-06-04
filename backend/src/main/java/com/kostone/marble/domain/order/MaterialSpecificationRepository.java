package com.kostone.marble.domain.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface MaterialSpecificationRepository extends JpaRepository<MaterialSpecification, UUID> {
    List<MaterialSpecification> findByOrderId(UUID orderId);
}
