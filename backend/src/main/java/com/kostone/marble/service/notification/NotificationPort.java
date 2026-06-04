package com.kostone.marble.service.notification;

/**
 * Notification delivery abstraction. Implemented in Group 13 (Notifications).
 * Stubbed here so Group 3 auth wiring compiles.
 */
public interface NotificationPort {

    void sendMagicLinkEmail(String toAddress, String customerName, String magicLinkUrl);

    void sendMagicLinkWhatsApp(String toPhoneNumber, String customerName, String magicLinkUrl);
}
