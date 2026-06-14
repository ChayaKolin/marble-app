package com.kostone.marble.dto.portal;

import com.kostone.marble.domain.order.MaterialSpecification;

import java.math.BigDecimal;

public record PortalMaterialSpec(
        String marbleModelCode,
        String finishType,
        BigDecimal squareMeters,
        String counterEdgeDetailing,
        boolean waterEdgeRequired,
        BigDecimal cooktopBaseFee
) {
    public static PortalMaterialSpec from(MaterialSpecification spec) {
        return new PortalMaterialSpec(
                spec.getMarbleModelCode(),
                spec.getFinishType(),
                spec.getSquareMeters(),
                spec.getCounterEdgeDetailing(),
                spec.isWaterEdgeRequired(),
                spec.getCooktopBaseFee()
        );
    }
}
