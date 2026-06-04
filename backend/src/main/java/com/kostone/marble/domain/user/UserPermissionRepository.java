package com.kostone.marble.domain.user;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface UserPermissionRepository extends JpaRepository<UserPermission, UUID> {

    @Query("SELECT p.feature FROM UserPermission p WHERE p.user.id = :userId AND p.granted = true")
    List<FeatureKey> findGrantedFeaturesByUserId(UUID userId);

    Optional<UserPermission> findByUserIdAndFeature(UUID userId, FeatureKey feature);
}
