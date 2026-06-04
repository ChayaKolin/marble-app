package com.kostone.marble.service.auth;

import com.kostone.marble.domain.user.FeatureKey;
import com.kostone.marble.domain.user.UserPermissionRepository;
import com.kostone.marble.dto.auth.LoginRequest;
import com.kostone.marble.dto.auth.LoginResponse;
import com.kostone.marble.security.JwtUtil;
import com.kostone.marble.security.MarbleUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final UserPermissionRepository permissionRepository;

    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.username(), request.password()));

        MarbleUserDetails principal = (MarbleUserDetails) auth.getPrincipal();

        // Re-load granted features at login time — ensures JWT reflects current DB state.
        List<FeatureKey> features = permissionRepository.findGrantedFeaturesByUserId(principal.getUserId());

        String token = jwtUtil.issueUserToken(principal.getUserId(), principal.getRole(), features);
        List<String> featureNames = features.stream().map(FeatureKey::name).toList();

        return new LoginResponse(token, principal.getRole(), featureNames);
    }
}
