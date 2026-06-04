package com.kostone.marble.dto.signature;

import com.kostone.marble.domain.signature.DigitalSignature;
import com.kostone.marble.domain.signature.SignatureCategory;

import java.time.OffsetDateTime;
import java.util.UUID;

public record SignatureResponse(
        UUID id,
        UUID orderId,
        SignatureCategory category,
        String ipAddress,
        OffsetDateTime signedAt
) {
    public static SignatureResponse from(DigitalSignature s) {
        return new SignatureResponse(
                s.getId(),
                s.getOrder().getId(),
                s.getCategory(),
                s.getIpAddress(),
                s.getSignedAt()
        );
    }
}
