package com.kostone.marble.domain.logistics;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.UUID;

public interface LogisticsAssignmentRepository extends JpaRepository<LogisticsAssignment, UUID> {

    List<LogisticsAssignment> findByOrderId(UUID orderId);

    @Query("SELECT a FROM LogisticsAssignment a JOIN FETCH a.order JOIN FETCH a.installerUser " +
           "WHERE a.installerUser.id = :installerId AND a.completed = false " +
           "ORDER BY a.deliveryScheduledDate ASC")
    List<LogisticsAssignment> findActiveByInstallerId(UUID installerId);

    boolean existsByOrderIdAndInstallerUserId(UUID orderId, UUID installerUserId);
}
