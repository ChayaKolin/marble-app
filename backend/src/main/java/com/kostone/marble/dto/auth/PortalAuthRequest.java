package com.kostone.marble.dto.auth;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

public record PortalAuthRequest(
        @NotNull UUID customerId,
        @NotBlank @Pattern(regexp = "EMAIL|WHATSAPP") String channel
) {}
