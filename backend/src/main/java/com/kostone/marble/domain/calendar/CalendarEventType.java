package com.kostone.marble.domain.calendar;

public enum CalendarEventType {
    INSTALLATION,  // auto-created from logistics_assignments where is_primary = TRUE
    PREP_TASK,
    MEASUREMENT,
    SITE_VISIT     // auto-created from logistics_assignments where is_primary = FALSE
}
