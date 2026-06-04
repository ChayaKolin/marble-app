package com.kostone.marble.service.portal;

import com.kostone.marble.domain.financial.FinancialLedger;
import com.kostone.marble.domain.financial.FinancialLedgerRepository;
import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.signature.DigitalSignatureRepository;
import com.kostone.marble.domain.signature.SignatureCategory;
import com.kostone.marble.dto.portal.PaymentMilestoneStatus;
import com.kostone.marble.dto.portal.PortalOrderResponse;
import com.kostone.marble.security.MarbleUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PortalOrderService {

    private final OrderRepository orderRepository;
    private final FinancialLedgerRepository ledgerRepository;
    private final DigitalSignatureRepository signatureRepository;

    /**
     * Returns all active orders for the authenticated customer.
     * customer_id is extracted from the CUSTOMER JWT's `sub` claim via MarbleUserDetails.
     */
    @Transactional(readOnly = true)
    public List<PortalOrderResponse> getMyOrders() {
        UUID customerId = currentCustomerId();
        List<Order> orders = orderRepository.findActiveByCustomerId(customerId);
        return orders.stream().map(this::toPortalResponse).toList();
    }

    /**
     * Returns a single order, verifying it belongs to the authenticated customer.
     * Returns 404 if the order belongs to a different customer (no enumeration).
     */
    @Transactional(readOnly = true)
    public PortalOrderResponse getMyOrder(UUID orderId) {
        UUID customerId = currentCustomerId();
        Order order = orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .filter(o -> o.getCustomer().getId().equals(customerId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "הזמנה לא נמצאה"));
        return toPortalResponse(order);
    }

    private PortalOrderResponse toPortalResponse(Order order) {
        boolean disclaimerSigned = signatureRepository.existsByOrderIdAndCategory(
                order.getId(), SignatureCategory.PRE_MEASUREMENT_DISCLAIMER);
        boolean layoutSigned = signatureRepository.existsByOrderIdAndCategory(
                order.getId(), SignatureCategory.SLAB_LAYOUT_APPROVAL);

        List<FinancialLedger> ledgerEntries = ledgerRepository.findByOrderId(order.getId());
        List<PaymentMilestoneStatus> milestones = ledgerEntries.stream()
                .collect(Collectors.groupingBy(FinancialLedger::getMilestoneTier))
                .entrySet().stream()
                .map(entry -> {
                    int tier = entry.getKey();
                    var entries = entry.getValue();
                    // Sum all amounts for this tier; cleared if any entry is cleared
                    var total = entries.stream()
                            .map(FinancialLedger::getAmountAllocated)
                            .reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
                    boolean cleared = entries.stream().anyMatch(FinancialLedger::isCleared);
                    return PaymentMilestoneStatus.of(tier, total, cleared);
                })
                .sorted(java.util.Comparator.comparingInt(PaymentMilestoneStatus::tier))
                .toList();

        return PortalOrderResponse.from(order, disclaimerSigned, layoutSigned, milestones);
    }

    private UUID currentCustomerId() {
        MarbleUserDetails principal = (MarbleUserDetails)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return principal.getUserId();  // for CUSTOMER tokens, userId == customer_id
    }
}
