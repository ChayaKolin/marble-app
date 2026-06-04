package com.kostone.marble.domain.order;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface OrderRepository extends JpaRepository<Order, UUID> {

    @Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.deletedAt IS NULL ORDER BY o.createdAt DESC")
    List<Order> findAllActive();

    @Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.deletedAt IS NOT NULL ORDER BY o.deletedAt DESC")
    List<Order> findAllDeleted();

    Optional<Order> findByIdAndDeletedAtIsNull(UUID id);

    @Query("SELECT o FROM Order o JOIN FETCH o.customer WHERE o.customer.id = :customerId AND o.deletedAt IS NULL")
    List<Order> findActiveByCustomerId(UUID customerId);
}
