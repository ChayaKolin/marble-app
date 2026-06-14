package com.kostone.marble.service.notification;

/**
 * Notification delivery abstraction. Implemented in Group 13 (Notifications).
 * Stubbed here so Group 3 auth wiring compiles.
 */
public interface NotificationPort {

    /** @return true if the link was delivered via this channel; false if delivery failed (logged, not thrown). */
    boolean sendMagicLinkEmail(String toAddress, String customerName, String magicLinkUrl);

    /** @return true if the link was delivered via this channel; false if delivery failed (logged, not thrown). */
    boolean sendMagicLinkWhatsApp(String toPhoneNumber, String customerName, String magicLinkUrl);

    void notifyLayoutReady(String customerEmail, String customerPhone, String customerName, String portalUrl);

    void notifyMeasurementsUploaded(String hotmanPhone, String hotmanName, String orderRef);

    void notifyInstallerDispatched(String installerPhone, String installerName,
                                   String customerName, String address, String scheduledDate);

    void notifyJobComplete(String consultantEmail, String installerName, String customerName);
}
