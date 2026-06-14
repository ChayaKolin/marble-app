package com.kostone.marble.dto.portal;

import com.kostone.marble.domain.order.SinkMountStyle;
import com.kostone.marble.domain.order.SinkSpecification;

public record PortalSinkSpec(
        String brand,
        String modelName,
        int widthMm,
        int heightMm,
        int depthMm,
        String color,
        SinkMountStyle mountingStyle,
        int quantity,
        String notes
) {
    public static PortalSinkSpec from(SinkSpecification spec) {
        return new PortalSinkSpec(
                spec.getBrand(),
                spec.getModelName(),
                spec.getWidthMm(),
                spec.getHeightMm(),
                spec.getDepthMm(),
                spec.getColor(),
                spec.getMountingStyle(),
                spec.getQuantity(),
                spec.getNotes()
        );
    }
}
