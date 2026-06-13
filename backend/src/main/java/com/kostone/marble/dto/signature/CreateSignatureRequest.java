package com.kostone.marble.dto.signature;

import com.kostone.marble.domain.signature.SignatureCategory;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CreateSignatureRequest(
        @NotNull SignatureCategory category,
        @NotBlank String signatureData,  // base64 canvas payload or vector coordinates
        String notes                     // optional free-text notes (e.g. installer's completion remarks)
) {}
