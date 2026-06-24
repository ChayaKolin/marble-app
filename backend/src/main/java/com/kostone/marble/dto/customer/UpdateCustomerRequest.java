package com.kostone.marble.dto.customer;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateCustomerRequest(
        @NotBlank @Size(max = 150) String fullName,
        @NotBlank @Pattern(regexp = "^\\d{10}$", message = "מספר טלפון חייב להכיל 10 ספרות") String phoneNumber,
        @NotBlank @Email @Size(max = 150) String emailAddress,
        @NotBlank @Size(max = 300) String siteAddress,
        @NotBlank @Size(max = 100) String siteCity,
        Integer siteFloor,
        @Size(max = 20) String siteApt,
        @Size(max = 150) String architectName,
        @Pattern(regexp = "^(\\d{10})?$", message = "מספר טלפון חייב להכיל 10 ספרות") String architectPhone
) {}
