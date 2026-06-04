package com.kostone.marble.config;

import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.domain.user.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds initial users when running with the 'local' profile.
 * Only runs if no users exist — safe to restart without duplicates.
 *
 * Default credentials:
 *   Consultant : username=consultant  password=admin123
 *   Hotman     : username=hotman      password=admin123
 */
@Component
@Profile("local")
@RequiredArgsConstructor
@Slf4j
public class LocalDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        User consultant = new User();
        consultant.setUsername("consultant");
        consultant.setFullName("יועץ ראשי");
        consultant.setPasswordHash(passwordEncoder.encode("admin123"));
        consultant.setRole(UserRole.SUPER_ADMIN_OWNER);
        consultant.setPhoneNumber("+972500000001");
        userRepository.save(consultant);

        User hotman = new User();
        hotman.setUsername("hotman");
        hotman.setFullName("מנהל מפעל");
        hotman.setPasswordHash(passwordEncoder.encode("admin123"));
        hotman.setRole(UserRole.FACTORY_MANAGER);
        hotman.setPhoneNumber("+972500000002");
        userRepository.save(hotman);

        log.info("=======================================================");
        log.info("  Local dev users seeded:");
        log.info("  Consultant → username: consultant  password: admin123");
        log.info("  Hotman     → username: hotman      password: admin123");
        log.info("=======================================================");
    }
}
