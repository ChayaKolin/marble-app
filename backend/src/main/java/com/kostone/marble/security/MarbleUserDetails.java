package com.kostone.marble.security;

import com.kostone.marble.domain.user.FeatureKey;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRole;
import lombok.Getter;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Stream;

public class MarbleUserDetails implements UserDetails {

    @Getter
    private final UUID userId;
    @Getter
    private final UserRole role;
    @Getter
    private final List<FeatureKey> grantedFeatures;
    private final String username;
    private final String passwordHash;
    private final List<GrantedAuthority> authorities;

    public MarbleUserDetails(User user, List<FeatureKey> grantedFeatures) {
        this.userId = user.getId();
        this.role = user.getRole();
        this.grantedFeatures = grantedFeatures;
        this.username = user.getUsername();
        this.passwordHash = user.getPasswordHash();
        this.authorities = Stream.concat(
                Stream.of((GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + user.getRole().name())),
                grantedFeatures.stream().map(f -> (GrantedAuthority) new SimpleGrantedAuthority("FEATURE_" + f.name()))
        ).toList();
    }

    /** Constructor for JWT-derived authentication (no password needed). */
    public MarbleUserDetails(UUID userId, UserRole role, List<String> featureNames) {
        this.userId = userId;
        this.role = role;
        this.grantedFeatures = featureNames.stream()
                .map(FeatureKey::valueOf)
                .toList();
        this.username = userId.toString();
        this.passwordHash = null;
        this.authorities = Stream.concat(
                Stream.of((GrantedAuthority) new SimpleGrantedAuthority("ROLE_" + role.name())),
                this.grantedFeatures.stream().map(f -> (GrantedAuthority) new SimpleGrantedAuthority("FEATURE_" + f.name()))
        ).toList();
    }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword() { return passwordHash; }
    @Override public String getUsername() { return username; }
    @Override public boolean isAccountNonExpired() { return true; }
    @Override public boolean isAccountNonLocked() { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
    @Override public boolean isEnabled() { return true; }
}
