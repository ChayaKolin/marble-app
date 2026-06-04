package com.kostone.marble.service.permission;

import com.kostone.marble.domain.user.*;
import com.kostone.marble.dto.permission.PermissionUpdateRequest;
import com.kostone.marble.dto.permission.PermissionUpdateResponse;
import com.kostone.marble.dto.permission.UserPermissionsResponse;
import com.kostone.marble.security.MarbleUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.Arrays;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PermissionService {

    private final UserRepository userRepository;
    private final UserPermissionRepository permissionRepository;

    /**
     * Returns the current granted state for all toggleable features for a user.
     * Useful for rendering the permission panel with correct initial toggle state.
     */
    @Transactional(readOnly = true)
    public UserPermissionsResponse getPermissions(UUID targetUserId) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        Map<FeatureKey, Boolean> permissions = Arrays.stream(FeatureKey.values())
                .collect(Collectors.toMap(
                        f -> f,
                        f -> permissionRepository.findByUserIdAndFeature(targetUserId, f)
                                .map(UserPermission::isGranted)
                                .orElse(false)
                ));

        return new UserPermissionsResponse(target.getId(), target.getFullName(), permissions);
    }

    /**
     * Upserts a single feature permission for a target user.
     * Only SUPER_ADMIN_OWNER may call this — enforced at controller level via @PreAuthorize.
     */
    @Transactional
    public PermissionUpdateResponse updatePermission(UUID targetUserId, PermissionUpdateRequest request) {
        User target = userRepository.findById(targetUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        User grantingUser = resolveCurrentUser();

        UserPermission permission = permissionRepository
                .findByUserIdAndFeature(targetUserId, request.feature())
                .orElseGet(() -> {
                    UserPermission p = new UserPermission();
                    p.setUser(target);
                    p.setFeature(request.feature());
                    p.setGrantedBy(grantingUser);
                    return p;
                });

        permission.setGranted(request.granted());
        permission.setGrantedBy(grantingUser);
        permission.setGrantedAt(OffsetDateTime.now());
        permissionRepository.save(permission);

        return new PermissionUpdateResponse(
                targetUserId,
                request.feature(),
                request.granted(),
                permission.getGrantedAt()
        );
    }

    private User resolveCurrentUser() {
        MarbleUserDetails principal = (MarbleUserDetails)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
        return userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Authenticated user not found"));
    }
}
