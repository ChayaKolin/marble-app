package com.kostone.marble.domain.order;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface OrderPhotoRepository extends JpaRepository<OrderPhoto, UUID> {
    List<OrderPhoto> findByOrderIdOrderByUploadedAtAsc(UUID orderId);
}
