package com.kostone.marble.dto.permission;

import com.kostone.marble.domain.user.FeatureKey;

import java.util.Map;
import java.util.UUID;

public record UserPermissionsResponse(
        UUID userId,
        String fullName,
        Map<FeatureKey, Boolean> permissions  // feature → granted
) {}
