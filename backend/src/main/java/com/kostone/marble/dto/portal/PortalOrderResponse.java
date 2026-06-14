package com.kostone.marble.dto.portal;

import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public record PortalOrderResponse(
        UUID id,
        OrderStatus status,
        String statusHe,
        // Delivery address
        String effectiveAddress,
        String effectiveCity,
        Integer effectiveFloor,
        String effectiveApt,
        // Documents
        String layoutDocumentUrl,
        String measurementsDocumentUrl,
        // Signature status (for portal actions)
        boolean measurementDisclaimerSigned,
        boolean layoutApprovalSigned,
        boolean quotationApprovalSigned,
        // Quotation details (for QUOTATION-stage approval)
        BigDecimal totalGrossAmount,
        boolean craneRequired,
        List<PortalMaterialSpec> materialSpecs,
        List<PortalSinkSpec> sinkSpecs,
        // Payment milestones
        List<PaymentMilestoneStatus> paymentMilestones,
        OffsetDateTime createdAt
) {
    private static final Map<OrderStatus, String> STATUS_HE = Map.of(
            OrderStatus.QUOTATION,                   "הצעת מחיר",
            OrderStatus.CLOSED_AWAITING_MEASUREMENT, "סגירה ומחכה למדידה",
            OrderStatus.REVIEWING_LAYOUT,            "לעבור על התוכנית",
            OrderStatus.PRODUCTION,                  "ייצור",
            OrderStatus.AWAITING_INSTALLATION,       "מחכה להתקנה",
            OrderStatus.PENDING_REPAIR,              "מחכה לתיקון",
            OrderStatus.COMPLETED,                   "מושלם",
            OrderStatus.ARCHIVED,                    "ארכיון"
    );

    public static PortalOrderResponse from(
            Order order,
            boolean disclaimerSigned,
            boolean layoutSigned,
            boolean quotationApprovalSigned,
            List<PortalMaterialSpec> materialSpecs,
            List<PortalSinkSpec> sinkSpecs,
            List<PaymentMilestoneStatus> milestones) {
        return new PortalOrderResponse(
                order.getId(),
                order.getStatus(),
                STATUS_HE.getOrDefault(order.getStatus(), order.getStatus().name()),
                order.effectiveAddress(),
                order.effectiveCity(),
                order.effectiveFloor(),
                order.effectiveApt(),
                order.getLayoutDocumentUrl(),
                order.getMeasurementsDocumentUrl(),
                disclaimerSigned,
                layoutSigned,
                quotationApprovalSigned,
                order.getTotalGrossAmount(),
                order.isCraneRequired(),
                materialSpecs,
                sinkSpecs,
                milestones,
                order.getCreatedAt()
        );
    }
}
