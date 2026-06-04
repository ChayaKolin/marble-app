package com.kostone.marble.service.notification;

import com.kostone.marble.service.notification.EmailNotificationAdapter;
import com.twilio.rest.api.v2010.account.Message;
import com.twilio.type.PhoneNumber;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnExpression;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Component;

/**
 * Real notification adapter — active when twilio.account-sid is configured.
 * Sends WhatsApp messages via Twilio; falls back to email on WhatsApp failure (13.5).
 * All message content is in Hebrew.
 */
@Component("realNotificationAdapter")
@Primary
@ConditionalOnExpression("'${twilio.account-sid:}'.length() > 0")
@RequiredArgsConstructor
@Slf4j
public class RealNotificationAdapter implements NotificationPort {

    private final EmailNotificationAdapter emailAdapter;

    @Value("${twilio.whatsapp-from:whatsapp:+14155238886}")
    private String whatsappFrom;

    @Value("${kostone.system.email:kostonemarble@gmail.com}")
    private String systemEmail;

    // ── Hebrew message templates ─────────────────────────────────────────

    @Override
    public void sendMagicLinkEmail(String toAddress, String customerName, String magicLinkUrl) {
        String subject = "Kostone Marble — גישה לפורטל הלקוח";
        String body = String.format("""
                שלום %s,

                לחץ/י על הקישור הבא לכניסה לפורטל הלקוח שלך:
                %s

                הקישור תקף ל-24 שעות ולשימוש חד-פעמי.

                Kostone Marble
                kostonemarble@gmail.com
                """, customerName, magicLinkUrl);
        emailAdapter.send(toAddress, subject, body);
    }

    @Override
    public void sendMagicLinkWhatsApp(String toPhoneNumber, String customerName, String magicLinkUrl) {
        String msg = String.format(
                "שלום %s,\n\nהנה הקישור שלך לפורטל Kostone Marble:\n%s\n\nתקף ל-2 שעות.",
                customerName, magicLinkUrl);
        sendWhatsApp(toPhoneNumber, msg, () -> sendMagicLinkEmail(null, customerName, magicLinkUrl));
    }

    @Override
    public void notifyLayoutReady(String customerEmail, String customerPhone, String customerName, String portalUrl) {
        String msg = String.format(
                "שלום %s,\n\nתוכנית הפריסה לפרויקט שלך מוכנה לאישור.\n\nנא להיכנס לפורטל ולחתום:\n%s",
                customerName, portalUrl);
        sendWhatsApp(customerPhone, msg, () -> {
            if (customerEmail != null) {
                emailAdapter.send(customerEmail, "Kostone Marble — תוכנית הפריסה מוכנה לאישורך", msg);
            }
        });
    }

    @Override
    public void notifyMeasurementsUploaded(String hotmanPhone, String hotmanName, String orderRef) {
        String msg = String.format(
                "שלום %s,\n\nהמדידות להזמנה #%s הועלו למערכת.\nניתן להתחיל בהכנת תוכנית הפריסה.",
                hotmanName, orderRef.substring(0, 8));
        sendWhatsApp(hotmanPhone, msg, () ->
                emailAdapter.send(systemEmail, "Kostone — מדידות חדשות הועלו", msg));
    }

    @Override
    public void notifyInstallerDispatched(String installerPhone, String installerName,
                                          String customerName, String address, String scheduledDate) {
        String msg = String.format(
                "שלום %s,\n\nנקבעה לך עבודת התקנה:\nלקוח: %s\nכתובת: %s\nתאריך: %s\n\nהיכנס לאפליקציה לפרטים מלאים.",
                installerName, customerName, address, scheduledDate);
        sendWhatsApp(installerPhone, msg, () ->
                log.warn("WhatsApp failed for installer {} — no email fallback for installers", installerName));
    }

    @Override
    public void notifyJobComplete(String consultantEmail, String installerName, String customerName) {
        String subject = "Kostone Marble — עבודה הושלמה";
        String body = String.format(
                "המתקין %s סיים את ההתקנה אצל הלקוח %s.\nניתן לאשר את קבלת התשלום ולסגור את ההזמנה.",
                installerName, customerName);
        emailAdapter.send(consultantEmail, subject, body);
    }

    // ── Internal helper: try WhatsApp, fall back to runnable on failure ──

    private void sendWhatsApp(String toPhone, String body, Runnable fallback) {
        if (toPhone == null || toPhone.isBlank()) {
            log.warn("WhatsApp delivery skipped — no phone number");
            fallback.run();
            return;
        }
        try {
            String target = toPhone.startsWith("whatsapp:") ? toPhone : "whatsapp:" + toPhone;
            Message.creator(new PhoneNumber(target), new PhoneNumber(whatsappFrom), body).create();
            log.info("WhatsApp sent to {}", toPhone);
        } catch (Exception e) {
            log.error("WhatsApp delivery failed for {} — falling back: {}", toPhone, e.getMessage());
            fallback.run();  // Task 13.5: email fallback on WhatsApp failure
        }
    }
}
