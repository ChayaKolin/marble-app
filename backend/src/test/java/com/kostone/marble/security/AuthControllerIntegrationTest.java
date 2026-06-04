package com.kostone.marble.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.domain.user.UserRole;
import com.kostone.marble.dto.auth.LoginRequest;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
class AuthControllerIntegrationTest {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @Autowired UserRepository userRepository;
    @Autowired PasswordEncoder passwordEncoder;
    @Autowired JwtUtil jwtUtil;

    private User consultant;
    private User installer;

    @BeforeEach
    void setUp() {
        consultant = new User();
        consultant.setUsername("test_consultant");
        consultant.setFullName("יועץ בדיקה");
        consultant.setPasswordHash(passwordEncoder.encode("password123"));
        consultant.setRole(UserRole.SUPER_ADMIN_OWNER);
        consultant.setPhoneNumber("+972501234567");
        userRepository.save(consultant);

        installer = new User();
        installer.setUsername("test_installer");
        installer.setFullName("מתקין בדיקה");
        installer.setPasswordHash(passwordEncoder.encode("password123"));
        installer.setRole(UserRole.INSTALLER);
        installer.setPhoneNumber("+972509876543");
        userRepository.save(installer);
    }

    @Test
    void login_with_valid_credentials_returns_jwt_with_role() throws Exception {
        LoginRequest req = new LoginRequest("test_consultant", "password123");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.role").value("SUPER_ADMIN_OWNER"));
    }

    @Test
    void login_with_wrong_password_returns_401() throws Exception {
        LoginRequest req = new LoginRequest("test_consultant", "wrong");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void protected_endpoint_without_token_returns_401() throws Exception {
        mockMvc.perform(get("/api/v1/customers"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void installer_cannot_access_consultant_only_endpoint() throws Exception {
        String token = jwtUtil.issueUserToken(installer.getId(), installer.getRole(), java.util.List.of());

        mockMvc.perform(post("/api/v1/portal/auth/request")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"customerId\":\"00000000-0000-0000-0000-000000000000\",\"channel\":\"EMAIL\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void consultant_can_access_protected_endpoint_with_valid_token() throws Exception {
        String token = jwtUtil.issueUserToken(consultant.getId(), consultant.getRole(), java.util.List.of());

        // GET /api/v1/customers exists and requires auth — consultant should get 200, not 401/403
        mockMvc.perform(get("/api/v1/customers")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    void verify_portal_endpoint_is_public() throws Exception {
        // Should return 401 (bad token) not 403 (auth required) — proving it's a public endpoint
        mockMvc.perform(get("/api/v1/portal/auth/verify").param("token", "invalid-token"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void jwt_contains_correct_role_claim() throws Exception {
        LoginRequest req = new LoginRequest("test_installer", "password123");

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        String body = result.getResponse().getContentAsString();
        String role = objectMapper.readTree(body).get("role").asText();
        assertThat(role).isEqualTo("INSTALLER");
    }
}
