package com.kostone.marble.service.notification;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import sibApi.ApiClient;
import sibApi.Configuration;
import sibApi.TransactionalEmailsApi;
import sibApi.auth.ApiKeyAuth;
import sibModel.SendSmtpEmail;
import sibModel.SendSmtpEmailSender;
import sibModel.SendSmtpEmailTo;

import java.util.Collections;

@Component("emailNotificationAdapter")
@Slf4j
public class EmailNotificationAdapter {

    @Value("${BREVO_API_KEY}")
    private String apiKey;

    @Value("${KOSTONE_SYSTEM_EMAIL}")
    private String fromAddress;

    public boolean send(String to, String subject, String body) {
        try {
            ApiClient defaultClient = Configuration.getDefaultApiClient();
            ApiKeyAuth apiKeyAuth = (ApiKeyAuth) defaultClient.getAuthentication("api-key");
            apiKeyAuth.setApiKey(apiKey);

            TransactionalEmailsApi api = new TransactionalEmailsApi();
            SendSmtpEmail sendSmtpEmail = new SendSmtpEmail();

            sendSmtpEmail.setSender(new SendSmtpEmailSender().email(fromAddress));
            sendSmtpEmail.setTo(Collections.singletonList(new SendSmtpEmailTo().email(to)));
            sendSmtpEmail.setSubject(subject);
            sendSmtpEmail.setHtmlContent(body);

            api.sendTransacEmail(sendSmtpEmail);
            log.info("Email sent successfully to {}", to);
            return true;
        } catch (Exception e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
            return false;
        }
    }
}
