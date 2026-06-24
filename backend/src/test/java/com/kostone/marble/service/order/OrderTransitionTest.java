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
import com.kostone.marble.service.activity.ActivityLogService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import static com.kostone.marble.domain.order.OrderStatus.*;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderTransitionTest {

    @Mock OrderRepository orderRepository;
    @Mock CustomerRepository customerRepository;
    @Mock UserRepository userRepository;
    @Mock FinancialLedgerRepository ledgerRepository;
    @Mock DigitalSignatureRepository signatureRepository;
    @Mock ActivityLogService activityLogService;
    @Mock SecurityContext securityContext;
    @Mock Authentication authentication;

    @InjectMocks OrderService orderService;

    private Order makeOrder(OrderStatus status) {
        Customer customer = new Customer();
        customer.setSiteAddress("רחוב הרצל 1");
        customer.setSiteCity("תל אביב");

        Order order = new Order();
        order.setId(UUID.randomUUID());
        order.setStatus(status);
        order.setCustomer(customer);
        order.setTotalGrossAmount(new BigDecimal("10000.00"));
        return order;
    }

    // -------------------------------------------------------------------------
    // All 12 valid transitions — status changes accepted
    // -------------------------------------------------------------------------

    @ParameterizedTest(name = "{0} → {1}")
    @CsvSource({
        "QUOTATION, CLOSED_AWAITING_MEASUREMENT",
        "CLOSED_AWAITING_MEASUREMENT, REVIEWING_LAYOUT",
        "REVIEWING_LAYOUT, PRODUCTION",
        "PRODUCTION, AWAITING_INSTALLATION",
        "AWAITING_INSTALLATION, AWAITING_CUSTOMER_APPROVAL",
        "AWAITING_INSTALLATION, PENDING_REPAIR",
        "AWAITING_CUSTOMER_APPROVAL, COMPLETED",
        "AWAITING_CUSTOMER_APPROVAL, PENDING_REPAIR",
        "PENDING_REPAIR, AWAITING_INSTALLATION",
        "PENDING_REPAIR, AWAITING_CUSTOMER_APPROVAL",
        "PENDING_REPAIR, COMPLETED",
        "COMPLETED, ARCHIVED"
    })
    void valid_transitions_are_accepted(String from, String to) {
        OrderStatus fromStatus = OrderStatus.valueOf(from);
        OrderStatus toStatus = OrderStatus.valueOf(to);
        Order order = makeOrder(fromStatus);

        when(orderRepository.findByIdAndDeletedAtIsNull(order.getId())).thenReturn(Optional.of(order));
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        // Satisfy gates for guarded transitions
        if (fromStatus == REVIEWING_LAYOUT) {
            when(signatureRepository.existsByOrderIdAndCategory(order.getId(), SignatureCategory.SLAB_LAYOUT_APPROVAL))
                    .thenReturn(true);
        }
        if (toStatus == COMPLETED) {
            when(signatureRepository.existsByOrderIdAndCategory(order.getId(), SignatureCategory.FINAL_POST_INSTALLATION))
                    .thenReturn(true);
        }

        var result = orderService.transition(order.getId(), toStatus);
        assertThat(result.status()).isEqualTo(toStatus);
    }

    // -------------------------------------------------------------------------
    // Invalid transitions — 400 Bad Request
    // -------------------------------------------------------------------------

    @ParameterizedTest(name = "INVALID: {0} → {1}")
    @CsvSource({
        "QUOTATION, PRODUCTION",
        "QUOTATION, COMPLETED",
        "REVIEWING_LAYOUT, AWAITING_INSTALLATION",
        "PRODUCTION, QUOTATION",
        "AWAITING_INSTALLATION, COMPLETED",
        "ARCHIVED, QUOTATION"
    })
    void invalid_transitions_throw_400(String from, String to) {
        OrderStatus fromStatus = OrderStatus.valueOf(from);
        OrderStatus toStatus = OrderStatus.valueOf(to);
        Order order = makeOrder(fromStatus);

        when(orderRepository.findByIdAndDeletedAtIsNull(order.getId())).thenReturn(Optional.of(order));

        assertThatThrownBy(() -> orderService.transition(order.getId(), toStatus))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(400));
    }

    // -------------------------------------------------------------------------
    // Gate: layout signature — 409 when absent
    // (No financial gate on QUOTATION → CLOSED_AWAITING_MEASUREMENT; deposit is recorded after measurement)

    // -------------------------------------------------------------------------
    // Gate: layout signature — 409 when absent
    // -------------------------------------------------------------------------

    @Test
    void reviewing_layout_to_production_blocked_when_unsigned() {
        Order order = makeOrder(REVIEWING_LAYOUT);
        when(orderRepository.findByIdAndDeletedAtIsNull(order.getId())).thenReturn(Optional.of(order));
        when(signatureRepository.existsByOrderIdAndCategory(order.getId(), SignatureCategory.SLAB_LAYOUT_APPROVAL))
                .thenReturn(false);

        assertThatThrownBy(() -> orderService.transition(order.getId(), PRODUCTION))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(409));
    }

    @Test
    void reviewing_layout_to_production_allowed_when_signed() {
        Order order = makeOrder(REVIEWING_LAYOUT);
        when(orderRepository.findByIdAndDeletedAtIsNull(order.getId())).thenReturn(Optional.of(order));
        when(signatureRepository.existsByOrderIdAndCategory(order.getId(), SignatureCategory.SLAB_LAYOUT_APPROVAL))
                .thenReturn(true);
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = orderService.transition(order.getId(), PRODUCTION);
        assertThat(result.status()).isEqualTo(PRODUCTION);
    }

    // -------------------------------------------------------------------------
    // Gate: final post-installation signature — 409 when absent on → COMPLETED
    // -------------------------------------------------------------------------

    @Test
    void awaiting_customer_approval_to_completed_blocked_when_unsigned() {
        Order order = makeOrder(AWAITING_CUSTOMER_APPROVAL);
        when(orderRepository.findByIdAndDeletedAtIsNull(order.getId())).thenReturn(Optional.of(order));
        when(signatureRepository.existsByOrderIdAndCategory(order.getId(), SignatureCategory.FINAL_POST_INSTALLATION))
                .thenReturn(false);

        assertThatThrownBy(() -> orderService.transition(order.getId(), COMPLETED))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(409));
    }

    @Test
    void awaiting_customer_approval_to_completed_allowed_when_signed() {
        Order order = makeOrder(AWAITING_CUSTOMER_APPROVAL);
        when(orderRepository.findByIdAndDeletedAtIsNull(order.getId())).thenReturn(Optional.of(order));
        when(signatureRepository.existsByOrderIdAndCategory(order.getId(), SignatureCategory.FINAL_POST_INSTALLATION))
                .thenReturn(true);
        when(orderRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        var result = orderService.transition(order.getId(), COMPLETED);
        assertThat(result.status()).isEqualTo(COMPLETED);
    }

    @Test
    void pending_repair_to_completed_blocked_when_unsigned() {
        Order order = makeOrder(PENDING_REPAIR);
        when(orderRepository.findByIdAndDeletedAtIsNull(order.getId())).thenReturn(Optional.of(order));
        when(signatureRepository.existsByOrderIdAndCategory(order.getId(), SignatureCategory.FINAL_POST_INSTALLATION))
                .thenReturn(false);

        assertThatThrownBy(() -> orderService.transition(order.getId(), COMPLETED))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(ex -> assertThat(((ResponseStatusException) ex).getStatusCode().value()).isEqualTo(409));
    }
}
