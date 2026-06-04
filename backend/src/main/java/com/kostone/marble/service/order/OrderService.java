package com.kostone.marble.service.order;

import com.kostone.marble.domain.customer.Customer;
import com.kostone.marble.domain.customer.CustomerRepository;
import com.kostone.marble.domain.financial.FinancialLedgerRepository;
import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.order.OrderStatus;
import com.kostone.marble.domain.signature.DigitalSignatureRepository;
import com.kostone.marble.domain.signature.SignatureCategory;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.dto.order.CreateOrderRequest;
import com.kostone.marble.dto.order.OrderResponse;
import com.kostone.marble.security.MarbleUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static com.kostone.marble.domain.order.OrderStatus.*;

@Service
@RequiredArgsConstructor
public class OrderService {

    // -------------------------------------------------------------------------
    // Valid state machine transitions
    // -------------------------------------------------------------------------
    private static final Map<OrderStatus, Set<OrderStatus>> VALID_TRANSITIONS;

    static {
        VALID_TRANSITIONS = new EnumMap<>(OrderStatus.class);
        VALID_TRANSITIONS.put(QUOTATION,                   Set.of(CLOSED_AWAITING_MEASUREMENT));
        VALID_TRANSITIONS.put(CLOSED_AWAITING_MEASUREMENT, Set.of(REVIEWING_LAYOUT));
        VALID_TRANSITIONS.put(REVIEWING_LAYOUT,            Set.of(PRODUCTION));
        VALID_TRANSITIONS.put(PRODUCTION,                  Set.of(AWAITING_INSTALLATION));
        VALID_TRANSITIONS.put(AWAITING_INSTALLATION,       Set.of(COMPLETED, PENDING_REPAIR));
        VALID_TRANSITIONS.put(PENDING_REPAIR,              Set.of(AWAITING_INSTALLATION, COMPLETED));
        VALID_TRANSITIONS.put(COMPLETED,                   Set.of(ARCHIVED));
        VALID_TRANSITIONS.put(ARCHIVED,                    Set.of());
    }

    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final UserRepository userRepository;
    private final FinancialLedgerRepository ledgerRepository;
    private final DigitalSignatureRepository signatureRepository;

    /**
     * Creates a new order. Address fields pre-inherited from customer:
     * order-level address fields are left NULL (COALESCE resolves to customer default).
     * Override fields are only stored if explicitly provided in the request.
     */
    @Transactional
    public OrderResponse create(CreateOrderRequest req) {
        Customer customer = customerRepository.findByIdAndDeletedAtIsNull(req.customerId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Customer not found"));

        User createdBy = resolveCurrentUser();

        Order order = new Order();
        order.setCustomer(customer);
        order.setStatus(OrderStatus.QUOTATION);
        order.setTotalGrossAmount(req.totalGrossAmount());

        // Address: only set override if explicitly provided (NULL = inherit from customer)
        order.setSiteAddress(req.siteAddress());
        order.setSiteCity(req.siteCity());
        order.setSiteFloor(req.siteFloor());
        order.setSiteApt(req.siteApt());

        // Logistics
        order.setElevatorWidthMeters(req.elevatorWidthMeters());
        order.setElevatorHeightMeters(req.elevatorHeightMeters());
        order.setCraneRequired(Boolean.TRUE.equals(req.craneRequired()));
        order.setFactorySlaDeadline(req.factorySlaDeadline());
        order.setNotes(req.notes());
        order.setCreatedByUser(createdBy);

        return OrderResponse.from(orderRepository.save(order));
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listActive() {
        return orderRepository.findAllActive().stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public List<OrderResponse> listDeleted() {
        return orderRepository.findAllDeleted().stream().map(OrderResponse::from).toList();
    }

    @Transactional(readOnly = true)
    public OrderResponse getById(UUID id) {
        return orderRepository.findByIdAndDeletedAtIsNull(id)
                .map(OrderResponse::from)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }

    /** Soft delete — stamps deleted_at; never issues SQL DELETE. */
    @Transactional
    public void softDelete(UUID id) {
        Order order = orderRepository.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        order.setDeletedAt(OffsetDateTime.now());
        orderRepository.save(order);
    }

    /** Restore — clears deleted_at. */
    @Transactional
    public OrderResponse restore(UUID id) {
        Order order = orderRepository.findById(id)
                .filter(Order::isDeleted)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Deleted order not found"));
        order.setDeletedAt(null);
        return OrderResponse.from(orderRepository.save(order));
    }

    // -------------------------------------------------------------------------
    // Task 6.1–6.3: State machine transition with gate checks
    // -------------------------------------------------------------------------

    /**
     * Advances an order to a new status, enforcing:
     * — Valid-transition table (400 on invalid path)
     * — 20% deposit gate: QUOTATION → CLOSED_AWAITING_MEASUREMENT (409 if unpaid)
     * — Layout signature gate: REVIEWING_LAYOUT → PRODUCTION (409 if unsigned)
     */
    @Transactional
    public OrderResponse transition(UUID orderId, OrderStatus targetStatus) {
        Order order = orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        OrderStatus current = order.getStatus();
        Set<OrderStatus> allowed = VALID_TRANSITIONS.getOrDefault(current, Set.of());

        if (!allowed.contains(targetStatus)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "מעבר לא חוקי מ-" + current.name() + " ל-" + targetStatus.name());
        }

        // Gate 1 — 20% deposit required before CLOSED_AWAITING_MEASUREMENT
        if (current == QUOTATION && targetStatus == CLOSED_AWAITING_MEASUREMENT) {
            assertDepositPaid(order);
        }

        // Gate 2 — SLAB_LAYOUT_APPROVAL signature required before PRODUCTION
        if (current == REVIEWING_LAYOUT && targetStatus == PRODUCTION) {
            assertLayoutSigned(order);
        }

        order.setStatus(targetStatus);
        return OrderResponse.from(orderRepository.save(order));
    }

    private void assertDepositPaid(Order order) {
        BigDecimal deposited = ledgerRepository.sumClearedAmountByOrderAndTier(order.getId(), 1);
        BigDecimal required = order.getTotalGrossAmount()
                .multiply(new BigDecimal("0.20"))
                .setScale(2, java.math.RoundingMode.HALF_UP);
        if (deposited.compareTo(required) < 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "נדרש תשלום מקדמה של 20% לפני המשך");
        }
    }

    private void assertLayoutSigned(Order order) {
        boolean signed = signatureRepository.existsByOrderIdAndCategory(
                order.getId(), SignatureCategory.SLAB_LAYOUT_APPROVAL);
        if (!signed) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "חתימת הלקוח על תוכנית הפריסה חובה לפני תחילת ייצור");
        }
    }

    private User resolveCurrentUser() {
        MarbleUserDetails principal = (MarbleUserDetails)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "User not found"));
    }
}
