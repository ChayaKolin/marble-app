package com.kostone.marble.domain.signature;

public enum SignatureCategory {
    PRE_MEASUREMENT_DISCLAIMER,
    SLAB_LAYOUT_APPROVAL,       // MANDATORY — blocks REVIEWING_LAYOUT → PRODUCTION
    FINAL_POST_INSTALLATION     // OPTIONAL
}
