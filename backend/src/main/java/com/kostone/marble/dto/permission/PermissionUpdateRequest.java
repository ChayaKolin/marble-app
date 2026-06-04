package com.kostone.marble.dto.permission;

import com.kostone.marble.domain.user.FeatureKey;
import jakarta.validation.constraints.NotNull;

public record PermissionUpdateRequest(
        @NotNull FeatureKey feature,
        @NotNull Boolean granted
) {}
