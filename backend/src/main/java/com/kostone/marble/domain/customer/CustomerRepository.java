package com.kostone.marble.domain.customer;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CustomerRepository extends JpaRepository<Customer, UUID> {

    List<Customer> findAllByDeletedAtIsNull();

    Optional<Customer> findByIdAndDeletedAtIsNull(UUID id);
}
