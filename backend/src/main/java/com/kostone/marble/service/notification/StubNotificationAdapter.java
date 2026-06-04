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
}
