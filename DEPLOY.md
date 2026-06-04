# Kostone Marble — Deployment Checklist

## Railway.com Setup (Task 15.1)

Set these environment variables in the Railway dashboard before first deploy:

```
SPRING_DATASOURCE_URL       jdbc:postgresql://<host>:<port>/kostonemarble_db
SPRING_DATASOURCE_USERNAME  postgres
SPRING_DATASOURCE_PASSWORD  <from Railway PostgreSQL plugin>
KOSTONE_SYSTEM_EMAIL        kostonemarble@gmail.com
KOSTONE_EMAIL_PASSWORD      <Gmail App Password>
JWT_SIGNING_KEY             <random 256-bit hex string>
TWILIO_ACCOUNT_SID          <from Twilio console>
TWILIO_AUTH_TOKEN           <from Twilio console>
TWILIO_WHATSAPP_FROM        whatsapp:+14155238886
UPLOAD_DIR                  /data/uploads
BASE_URL                    https://<your-railway-domain>
```

## First Deploy (Task 15.2)

1. Push to Railway → Dockerfile builds backend JAR
2. On startup, Flyway runs:
   - V1__initial_schema.sql (all tables + enums)
   - V2__seed_users.sql (placeholder Consultant + Hotman)
   - V3__order_documents.sql (layout/measurement URL columns)
3. Verify: GET /api/v1/auth/login with seeded credentials returns JWT

## Seed Production Users (Task 15.4)

Update V2__seed_users.sql with real:
- `full_name`, `phone_number` for both users
- BCrypt-hashed passwords (use: `htpasswd -bnBC 12 "" <password> | tr -d ':\n'`)
- Run `INSERT` directly or via Flyway V4 migration

## Daily Backup (Task 15.6)

In Railway Dashboard → PostgreSQL plugin:
- Enable automatic backups: ON
- Retention period: 30 days minimum
- Alert email: kostonemarble@gmail.com

## WhatsApp Template Submission (Task 13.4)

Submit these Hebrew templates to Twilio for WhatsApp Business approval:
1. Magic-link: "שלום {{1}}, הנה הקישור שלך: {{2}}"
2. Layout ready: "שלום {{1}}, תוכנית הפריסה מוכנה לאישורך: {{2}}"
3. Installer dispatch: "שלום {{1}}, ה-{{2}} נקבעה לך עבודה אצל {{3}} בכתובת {{4}}"
4. Measurements uploaded: "שלום {{1}}, מדידות הזמנה #{{2}} הועלו למערכת"

## Go-Live Verification (Task 15.5–15.8)

Walk through full lifecycle:
1. Create customer + order (QUOTATION)
2. Record 20% deposit → advance to CLOSED_AWAITING_MEASUREMENT
3. Upload measurements → REVIEWING_LAYOUT
4. Upload layout PDF → notify customer (check WhatsApp/email)
5. Customer clicks portal magic-link → signs layout
6. Advance to PRODUCTION → SLA timer starts on Hotman deck
7. Create logistics assignment → calendar event appears
8. Installer app: view job, mark complete, optionally sign
9. Consultant: confirm 80% payment → COMPLETED
10. Archive
