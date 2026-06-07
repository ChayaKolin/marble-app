package com.kostone.marble.dto.measurer;

import com.kostone.marble.domain.measurer.Measurer;

import java.util.UUID;

public record MeasurerResponse(
        UUID id,
        String firstName,
        String lastName,
        String phoneNumber
) {
    public static MeasurerResponse from(Measurer m) {
        return new MeasurerResponse(m.getId(), m.getFirstName(), m.getLastName(), m.getPhoneNumber());
    }
}
