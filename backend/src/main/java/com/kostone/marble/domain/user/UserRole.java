package com.kostone.marble.domain.user;

public enum UserRole {
    SUPER_ADMIN_OWNER,
    FACTORY_MANAGER,
    INSTALLER,
    CUSTOMER  // not stored in users table — used only in customer portal JWTs
}
