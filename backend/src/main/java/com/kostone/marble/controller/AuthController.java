package com.kostone.marble.controller;

import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.domain.user.UserRole;
import com.kostone.marble.dto.auth.LoginRequest;
import com.kostone.marble.dto.auth.LoginResponse;
import com.kostone.marble.service.auth.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final UserRepository userRepository;

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
