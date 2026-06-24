package com.kostone.marble.service.notification;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import sibApi.ApiClient;
import sibApi.ApiException;
import sibApi.Configuration;
import sibApi.TransactionalEmailsApi;
import sibApi.auth.ApiKeyAuth;
import sibModel.SendSmtpEmail;
import sibModel.SendSmtpEmailSender;
import sibModel.SendSmtpEmailTo;

import java.util.List;

/**
 * Email delivery via Brevo REST API (replaces Gmail SMTP).
 * Uses HTTPS port 443 — no SMTP port-blocking issues in production.
 */
@Component("emailNotificationAdapter")
@Slf4j
public class EmailNotificationAdapter {

    @Value("${brevo.api-key:}")
    private String apiKey;

    @Value("${kostone.system.email:kostonemarble@gmail.com}")
    private String fromAddress;

    private TransactionalEmailsApi brevoApi;

    @PostConstruct
    public void init() {
        ApiClient client = Configuration.getDefaultApiClient();
        ((ApiKeyAuth) client.getAuthentication("api-key")).setApiKey(apiKey);
        brevoApi = new TransactionalEmailsApi();
    }

    /**
     * Sends an email via Brevo. Returns true on success; logs and returns false on
     * failure rather than throwing — email delivery is best-effort and must not
     * abort the calling business operation (magic-link issuance, layout upload, etc.).
     */
    public boolean send(String to, String subject, String body) {
        try {
            SendSmtpEmail email = new SendSmtpEmail();
            email.setSender(new SendSmtpEmailSender().email(fromAddress).name("Kostone Marble"));
            email.setTo(List.of(new SendSmtpEmailTo().email(to)));
            email.setSubject(subject);
            email.setTextContent(body);
            brevoApi.sendTransacEmail(email);
            log.info("Email sent to {}: {}", to, subject);
            return true;
        } catch (ApiException e) {
            log.error("Failed to send email to {} [HTTP {}]: {}", to, e.getCode(), e.getResponseBody());
            return false;
        } catch (Exception e) {
            log.error("Failed to send email to {} [{}]: {}", to, e.getClass().getSimpleName(), e.getMessage());
            return false;
        }
    }
}
