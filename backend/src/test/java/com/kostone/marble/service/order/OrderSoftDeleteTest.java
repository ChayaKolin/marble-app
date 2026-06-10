package com.kostone.marble.service.order;

import com.kostone.marble.domain.activity.ActivityLogRepository;
import com.kostone.marble.domain.customer.Customer;
import com.kostone.marble.domain.customer.CustomerRepository;
import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.order.OrderStatus;
import com.kostone.marble.domain.signature.DigitalSignature;
import com.kostone.marble.domain.signature.DigitalSignatureRepository;
import com.kostone.marble.domain.signature.SignatureCategory;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.domain.user.UserRole;
import com.kostone.marble.security.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Order soft-delete is permitted any time before the customer has digitally approved
 * the slab layout (SLAB_LAYOUT_APPROVAL signature) — once approved, deletion is blocked.
 * An optional deletion reason is recorded in the activity log.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrderSoftDeleteTest {

    @Autowired MockMvc mockMvc;
    @Autowired UserRepository userRepository;
    @Autowired CustomerRepository customerRepository;
    @Autowired OrderRepository orderRepository;
    @Autowired DigitalSignatureRepository signatureRepository;
    @Autowired ActivityLogRepository activityLogRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtUtil jwtUtil;

    private String consultantToken;
    private Customer customer;
    private User consultant;

    @BeforeEach
    void setUp() {
        consultant = new User();
        consultant.setUsername("delete_test_consultant");
        consultant.setFullName("יועץ בדיקת מחיקה");
        consultant.setPasswordHash(passwordEncoder.encode("password"));
        consultant.setRole(UserRole.SUPER_ADMIN_OWNER);
        consultant.setPhoneNumber("+972501111112");
        userRepository.save(consultant);
        consultantToken = jwtUtil.issueUserToken(consultant.getId(), UserRole.SUPER_ADMIN_OWNER, List.of());

        customer = new Customer();
        customer.setFullName("לקוח בדיקת מחיקה");
        customer.setPhoneNumber("+972502222223");
        customer.setEmailAddress("delete-test@example.com");
        customer.setSiteAddress("רחוב הרצל 11");
        customer.setSiteCity("חיפה");
        customerRepository.save(customer);
    }

    private Order createOrder(OrderStatus status) {
        Order order = new Order();
        order.setCustomer(customer);
        order.setStatus(status);
        order.setTotalGrossAmount(new BigDecimal("20000.00"));
        order.setCreatedByUser(consultant);
        return orderRepository.save(order);
    }

    @Test
    void delete_in_QUOTATION_returns_204_and_soft_deletes() throws Exception {
        Order order = createOrder(OrderStatus.QUOTATION);

        mockMvc.perform(delete("/api/v1/orders/{id}", order.getId())
                        .header("Authorization", "Bearer " + consultantToken))
                .andExpect(status().isNoContent());

        Order reloaded = orderRepository.findById(order.getId()).orElseThrow();
        assertNotNull(reloaded.getDeletedAt());
    }

    @Test
    void delete_in_CLOSED_AWAITING_MEASUREMENT_is_allowed() throws Exception {
        Order order = createOrder(OrderStatus.CLOSED_AWAITING_MEASUREMENT);

        mockMvc.perform(delete("/api/v1/orders/{id}", order.getId())
                        .header("Authorization", "Bearer " + consultantToken))
                .andExpect(status().isNoContent());

        Order reloaded = orderRepository.findById(order.getId()).orElseThrow();
        assertNotNull(reloaded.getDeletedAt());
    }

    @Test
    void delete_in_REVIEWING_LAYOUT_without_signature_is_allowed_and_records_reason() throws Exception {
        Order order = createOrder(OrderStatus.REVIEWING_LAYOUT);

        mockMvc.perform(delete("/api/v1/orders/{id}", order.getId())
                        .header("Authorization", "Bearer " + consultantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\":\"הלקוח התחרט\"}"))
                .andExpect(status().isNoContent());

        Order reloaded = orderRepository.findById(order.getId()).orElseThrow();
        assertNotNull(reloaded.getDeletedAt());

        var entry = activityLogRepository.findTop200ByOrderByCreatedAtDesc().stream()
                .filter(a -> a.getEntityId().equals(order.getId()))
                .filter(a -> a.getAction().name().equals("ORDER_DELETED"))
                .findFirst().orElseThrow();
        assertEquals("הלקוח התחרט", entry.getReason());
    }

    @Test
    void delete_blocked_once_layout_approved_by_customer() throws Exception {
        Order order = createOrder(OrderStatus.REVIEWING_LAYOUT);

        DigitalSignature sig = new DigitalSignature();
        sig.setOrder(order);
        sig.setCategory(SignatureCategory.SLAB_LAYOUT_APPROVAL);
        sig.setSignatureVectorData("data:image/png;base64,TESTSIGNATURE==");
        signatureRepository.save(sig);

        mockMvc.perform(delete("/api/v1/orders/{id}", order.getId())
                        .header("Authorization", "Bearer " + consultantToken))
                .andExpect(status().isConflict());  // 409

        Order reloaded = orderRepository.findById(order.getId()).orElseThrow();
        assertNull(reloaded.getDeletedAt());
    }
}
