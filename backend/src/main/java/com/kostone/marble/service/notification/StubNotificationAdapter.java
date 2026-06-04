package com.kostone.marble.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Stub adapter — logs notifications to console.
 * Replaced by the real adapter in Group 13 (Notifications).
 */
@Component
@Primary
@ConditionalOnMissingBean(name = "realNotificationAdapter")
@Slf4j
public class StubNotificationAdapter implements NotificationPort {

    @Override
    public void sendMagicLinkEmail(String toAddress, String customerName, String magicLinkUrl) {
        log.info("[STUB EMAIL] To: {} | Name: {} | Link: {}", toAddress, customerName, magicLinkUrl);
    }

    @Override
    public void sendMagicLinkWhatsApp(String toPhoneNumber, String customerName, String magicLinkUrl) {
        log.info("[STUB WHATSAPP] To: {} | Name: {} | Link: {}", toPhoneNumber, customerName, magicLinkUrl);
    }

    @Override
    public void notifyLayoutReady(String customerEmail, String customerPhone, String customerName, String portalUrl) {
        log.info("[STUB] Layout ready → Customer: {} | Email: {} | WhatsApp: {} | Portal: {}",
                customerName, customerEmail, customerPhone, portalUrl);
    }

    @Override
    public void notifyMeasurementsUploaded(String hotmanPhone, String hotmanName, String orderRef) {
        log.info("[STUB] Measurements uploaded → Hotman: {} ({}) | Order: {}", hotmanName, hotmanPhone, orderRef);
    }

    @Override
    public void notifyInstallerDispatched(String installerPhone, String installerName,
                                          String customerName, String address, String scheduledDate) {
        log.info("[STUB] Installer dispatched → {} ({}) | Customer: {} | Address: {} | Date: {}",
                installerName, installerPhone, customerName, address, scheduledDate);
    }

    @Override
    public void notifyJobComplete(String consultantEmail, String installerName, String customerName) {
        log.info("[STUB] Job complete → Consultant: {} | Installer: {} | Customer: {}",
                consultantEmail, installerName, customerName);
    }
}
