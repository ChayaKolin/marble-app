package com.kostone.marble.service.logistics;

import com.kostone.marble.domain.event.LogisticsAssignmentCreatedEvent;
import com.kostone.marble.domain.logistics.LogisticsAssignment;
import com.kostone.marble.domain.logistics.LogisticsAssignmentRepository;
import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.signature.DigitalSignatureRepository;
import com.kostone.marble.domain.signature.SignatureCategory;
import com.kostone.marble.domain.user.User;
import com.kostone.marble.domain.user.UserRepository;
import com.kostone.marble.domain.user.UserRole;
import com.kostone.marble.dto.logistics.CreateLogisticsRequest;
import com.kostone.marble.dto.logistics.LogisticsAssignmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LogisticsService {

    private final LogisticsAssignmentRepository assignmentRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final DigitalSignatureRepository signatureRepository;
    private final ApplicationEventPublisher eventPublisher;

    @Transactional(readOnly = true)
    public List<LogisticsAssignmentResponse> listByOrder(UUID orderId) {
        return assignmentRepository.findByOrderId(orderId)
                .stream().map(LogisticsAssignmentResponse::from).toList();
    }

    /**
     * Creates a logistics assignment and publishes a LogisticsAssignmentCreatedEvent.
     * The event listener (CalendarEventCreationListener) auto-creates the calendar entry.
     */
    @Transactional
    public LogisticsAssignmentResponse createAssignment(UUID orderId, CreateLogisticsRequest req) {
        Order order = orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        User installer = userRepository.findById(req.installerUserId())
                .filter(u -> u.getRole() == UserRole.INSTALLER)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Installer user not found or not an INSTALLER role"));

        LogisticsAssignment assignment = new LogisticsAssignment();
        assignment.setOrder(order);
        assignment.setInstallerUser(installer);
        assignment.setDeliveryScheduledDate(req.deliveryScheduledDate());
        assignment.setPrimary(req.primary());
        assignment.setInstallerNotes(req.installerNotes());
        assignmentRepository.save(assignment);

        // Publish event — CalendarEventCreationListener creates the calendar entry
        eventPublisher.publishEvent(new LogisticsAssignmentCreatedEvent(assignment));

        return LogisticsAssignmentResponse.from(assignment);
    }

    /**
     * Mark assignment complete (called from installer sign-off flow).
     * Requires a FINAL_POST_INSTALLATION signature on the order first — the
     * customer must confirm the installation is complete before the installer
     * can proceed to collect the remaining balance.
     */
    @Transactional
    public LogisticsAssignmentResponse markComplete(UUID orderId, UUID assignmentId) {
        LogisticsAssignment assignment = assignmentRepository.findById(assignmentId)
                .filter(a -> a.getOrder().getId().equals(orderId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Assignment not found"));

        if (!signatureRepository.existsByOrderIdAndCategory(orderId, SignatureCategory.FINAL_POST_INSTALLATION)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "יש לקבל את חתימת הלקוח המאשרת סיום ההתקנה לפני סיום העבודה");
        }

        assignment.setCompleted(true);
        return LogisticsAssignmentResponse.from(assignmentRepository.save(assignment));
    }
}
