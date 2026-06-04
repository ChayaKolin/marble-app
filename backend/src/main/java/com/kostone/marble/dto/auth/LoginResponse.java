package com.kostone.marble.dto.auth;

import com.kostone.marble.domain.user.UserRole;

import java.util.List;

public record LoginResponse(
        String accessToken,
        UserRole role,
        List<String> grantedFeatures
) {}
