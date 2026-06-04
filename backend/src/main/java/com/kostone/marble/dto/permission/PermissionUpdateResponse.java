package com.kostone.marble.dto.permission;

import com.kostone.marble.domain.user.FeatureKey;

import java.time.OffsetDateTime;
import java.util.UUID;

public record PermissionUpdateResponse(
        UUID userId,
        FeatureKey feature,
        boolean granted,
        OffsetDateTime grantedAt
) {}
