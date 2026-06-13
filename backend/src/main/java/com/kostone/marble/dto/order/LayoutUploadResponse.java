package com.kostone.marble.dto.order;

/**
 * Response after uploading the layout PDF: the stored document URL and a fresh
 * portal magic-link the Consultant/Hotman can share with the customer manually
 * (mirroring the auto-sent notification, which uses the same link).
 */
public record LayoutUploadResponse(String layoutDocumentUrl, String portalUrl) {}
