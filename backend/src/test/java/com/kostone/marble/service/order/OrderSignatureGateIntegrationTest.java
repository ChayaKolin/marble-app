package com.kostone.marble.service.order;

import com.fasterxml.jackson.databind.ObjectMapper;
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
import com.kostone.marble.dto.order.TransitionRequest;
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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Integration test: REVIEWING_LAYOUT → PRODUCTION signature gate.
 * Verifies the 409/200 behaviour end-to-end through the HTTP layer.
 */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class OrderSignatureGateIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired CustomerRepository customerRepository;
    @Autowired OrderRepository orderRepository;
    @Autowired DigitalSignatureRepository signatureRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtUtil jwtUtil;

    private String consultantToken;
    private Order testOrder;

    @BeforeEach
    void setUp() {
        User consultant = new User();
        consultant.setUsername("gate_test_consultant");
        consultant.setFullName("יועץ בדיקת שער");
        consultant.setPasswordHash(passwordEncoder.encode("password"));
        consultant.setRole(UserRole.SUPER_ADMIN_OWNER);
        consultant.setPhoneNumber("+972501111111");
        userRepository.save(consultant);
        consultantToken = jwtUtil.issueUserToken(consultant.getId(), UserRole.SUPER_ADMIN_OWNER, List.of());

        Customer customer = new Customer();
        customer.setFullName("לקוח בדיקה");
        customer.setPhoneNumber("+972502222222");
        customer.setEmailAddress("test@example.com");
        customer.setSiteAddress("רחוב הרצל 10");
        customer.setSiteCity("חיפה");
        customerRepository.save(customer);

        testOrder = new Order();
        testOrder.setCustomer(customer);
        testOrder.setStatus(OrderStatus.REVIEWING_LAYOUT);
        testOrder.setTotalGrossAmount(new BigDecimal("20000.00"));
        testOrder.setCreatedByUser(consultant);
        orderRepository.save(testOrder);
    }

    @Test
    void transition_to_PRODUCTION_returns_409_when_layout_not_signed() throws Exception {
        mockMvc.perform(put("/api/v1/orders/{id}/status", testOrder.getId())
                        .header("Authorization", "Bearer " + consultantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransitionRequest(OrderStatus.PRODUCTION))))
                .andExpect(status().isConflict());  // 409
    }

    @Test
    void transition_to_PRODUCTION_returns_200_after_layout_signed() throws Exception {
        // Seed the SLAB_LAYOUT_APPROVAL signature
        DigitalSignature sig = new DigitalSignature();
        sig.setOrder(testOrder);
        sig.setCategory(SignatureCategory.SLAB_LAYOUT_APPROVAL);
        sig.setSignatureVectorData("data:image/png;base64,TESTSIGNATURE==");
        signatureRepository.save(sig);

        // Now transition should succeed
        mockMvc.perform(put("/api/v1/orders/{id}/status", testOrder.getId())
                        .header("Authorization", "Bearer " + consultantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransitionRequest(OrderStatus.PRODUCTION))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PRODUCTION"));
    }

    @Test
    void invalid_transition_returns_400() throws Exception {
        // REVIEWING_LAYOUT → COMPLETED is not a valid transition
        mockMvc.perform(put("/api/v1/orders/{id}/status", testOrder.getId())
                        .header("Authorization", "Bearer " + consultantToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new TransitionRequest(OrderStatus.COMPLETED))))
                .andExpect(status().isBadRequest());  // 400
    }
}
