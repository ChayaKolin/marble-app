package com.kostone.marble.controller;

import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.domain.user.UserRole;
import com.kostone.marble.dto.auth.CreateInstallerRequest;
import com.kostone.marble.dto.auth.LoginRequest;
import com.kostone.marble.dto.auth.LoginResponse;
import com.kostone.marble.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.security.SecureRandom;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecureRandom secureRandom = new SecureRandom();

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    /** List installers — used by the logistics assignment form. */
    @GetMapping("/users/installers")
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN_OWNER','ROLE_FACTORY_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> listInstallers() {
        return ResponseEntity.ok(
            userRepository.findByRole(UserRole.INSTALLER).stream()
                .map(u -> Map.<String,Object>of(
                    "id", u.getId(), "fullName", u.getFullName(), "phoneNumber", u.getPhoneNumber()
                )).toList()
        );
    }

    /** Add a new installer to the roster — Consultant only, used when assigning logistics. */
    @PostMapping("/users/installers")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<Map<String, Object>> createInstaller(@Valid @RequestBody CreateInstallerRequest req) {
        User installer = new User();
        installer.setFullName(req.lastName() == null || req.lastName().isBlank()
                ? req.firstName()
                : req.firstName() + " " + req.lastName());
        installer.setPhoneNumber(req.phoneNumber());
        installer.setRole(UserRole.INSTALLER);
        installer.setUsername(generateInstallerUsername(req.phoneNumber()));
        installer.setPasswordHash(passwordEncoder.encode(randomToken()));
        userRepository.save(installer);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of(
                "id", installer.getId(), "fullName", installer.getFullName(), "phoneNumber", installer.getPhoneNumber()
        ));
    }

    /** Usernames must be unique; fall back to a numbered suffix if the phone number is already taken. */
    private String generateInstallerUsername(String phoneNumber) {
        String candidate = phoneNumber;
        int suffix = 1;
        while (userRepository.findByUsername(candidate).isPresent()) {
            candidate = phoneNumber + "_" + (++suffix);
        }
        return candidate;
    }

    private String randomToken() {
        byte[] bytes = new byte[18];
        secureRandom.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    /** List factory managers — used by the permissions panel. */
    @GetMapping("/users/hotmen")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<List<Map<String, Object>>> listHotmen() {
        return ResponseEntity.ok(
            userRepository.findByRole(UserRole.FACTORY_MANAGER).stream()
                .map(u -> Map.<String,Object>of(
                    "id", u.getId(), "fullName", u.getFullName()
                )).toList()
        );
    }
}
