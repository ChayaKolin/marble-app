package com.kostone.marble.security;

import com.kostone.marble.domain.user.FeatureKey;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserPermissionRepository;
import com.kostone.marble.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class MarbleUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserPermissionRepository permissionRepository;

    @Override
    @Transactional(readOnly = true)
    public MarbleUserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found: " + username));
        List<FeatureKey> features = permissionRepository.findGrantedFeaturesByUserId(user.getId());
        return new MarbleUserDetails(user, features);
    }
}
