package com.kostone.marble.dto.order;

import com.kostone.marble.domain.order.OrderStatus;
import jakarta.validation.constraints.NotNull;

public record TransitionRequest(@NotNull OrderStatus targetStatus) {}
