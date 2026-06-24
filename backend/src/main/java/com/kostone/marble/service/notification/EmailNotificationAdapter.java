package com.kostone.marble.service.notification;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Component;

/**
 * Email delivery via Spring Mail / Gmail SMTP.
 * Activated when KOSTONE_SYSTEM_EMAIL env var is set.
 * The StubNotificationAdapter acts as fallback in tests / local dev.
 */
@Component("emailNotificationAdapter")
@RequiredArgsConstructor
@Slf4j
public class EmailNotificationAdapter {

    private final JavaMailSender mailSender;

    @Value("${kostone.system.email:kostonemarble@gmail.com}")
    private String fromAddress;

    /**
     * Sends an email. Returns true on success; on failure (e.g. SMTP connectivity
     * issues) logs the error and returns false rather than throwing, since email
     * delivery is a best-effort side effect that must not fail the calling
     * business operation (magic-link issuance, layout upload, etc.).
     */
    public boolean send(String to, String subject, String body) {
        try {
            SimpleMailMessage msg = new SimpleMailMessage();
            msg.setFrom(fromAddress);
            msg.setTo(to);
            msg.setSubject(subject);
            msg.setText(body);
            mailSender.send(msg);
            log.info("Email sent to {}: {}", to, subject);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email to {} [{}]: {}", to, e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }
}
