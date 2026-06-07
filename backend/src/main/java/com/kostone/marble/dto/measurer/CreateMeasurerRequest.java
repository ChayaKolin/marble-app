package com.kostone.marble.dto.measurer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CreateMeasurerRequest(
        @NotBlank @Size(max = 100) String firstName,
        @NotBlank @Size(max = 100) String lastName,
        @NotBlank @Pattern(regexp = "^\\d{10}$", message = "מספר טלפון חייב להכיל 10 ספרות") String phoneNumber
) {}
