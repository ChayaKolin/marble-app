package com.kostone.marble.dto.order;

/** Optional reason the Consultant gives when deleting an order (shown later in the activity log). */
public record DeleteOrderRequest(String reason) {}
