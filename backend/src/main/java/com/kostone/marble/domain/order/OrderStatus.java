package com.kostone.marble.domain.order;

public enum OrderStatus {
    QUOTATION,                   // הצעת מחיר
    CLOSED_AWAITING_MEASUREMENT, // סגירה ומחכה למדידה
    REVIEWING_LAYOUT,            // לעבור על התוכנית
    PRODUCTION,                  // ייצור
    AWAITING_INSTALLATION,       // מחכה להתקנה
    AWAITING_CUSTOMER_APPROVAL,  // ממתין לאישור לקוח (לאחר קבלת תשלום יתרה)
    PENDING_REPAIR,              // מחכה לתיקון
    COMPLETED,                   // מושלם
    ARCHIVED                     // ארכיון
}
