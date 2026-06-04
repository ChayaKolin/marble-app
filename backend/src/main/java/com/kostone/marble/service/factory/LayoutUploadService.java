package com.kostone.marble.service.factory;

import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.order.OrderStatus;
import com.kostone.marble.service.notification.NotificationPort;
import com.kostone.marble.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class LayoutUploadService {

    private final OrderRepository orderRepository;
    private final FileStorageService fileStorageService;
    private final NotificationPort notificationPort;

    @Value("${app.base-url:http://localhost:5173}")
    private String baseUrl;

    @Value("${kostone.system.email:kostonemarble@gmail.com}")
    private String systemEmail;

    /**
     * Stores the layout PDF, links it to the order, and notifies the customer.
     * Order must be in REVIEWING_LAYOUT status.
     */
    @Transactional
    public String uploadLayout(UUID orderId, MultipartFile file) {
        Order order = requireOrderInStatus(orderId, OrderStatus.REVIEWING_LAYOUT,
                "תוכנית הפריסה ניתנת להעלאה רק בשלב בדיקת התוכנית");

        String fileUrl = fileStorageService.store(file, "layouts");
        order.setLayoutDocumentUrl(fileUrl);
        orderRepository.save(order);

        // Notify customer that their layout is ready for review and signature
        String portalUrl = baseUrl + "/portal/orders/" + orderId + "/layout";
        notificationPort.notifyLayoutReady(
                order.getCustomer().getEmailAddress(),
                order.getCustomer().getPhoneNumber(),
                order.getCustomer().getFullName(),
                portalUrl
        );

        return fileUrl;
    }

    /**
     * Stores field measurements and advances the order to REVIEWING_LAYOUT.
     * Notifies Hotman.
     */
    @Transactional
    public String uploadMeasurements(UUID orderId, MultipartFile file) {
        Order order = requireOrderInStatus(orderId, OrderStatus.CLOSED_AWAITING_MEASUREMENT,
                "מדידות ניתנות להעלאה רק בשלב ההמתנה למדידה");

        String fileUrl = fileStorageService.store(file, "measurements");
        order.setMeasurementsDocumentUrl(fileUrl);
        order.setStatus(OrderStatus.REVIEWING_LAYOUT);
        orderRepository.save(order);

        // Notify Hotman
        // In a real system, we'd look up the Hotman user. For now, log via stub.
        notificationPort.notifyMeasurementsUploaded(
                "hotman-phone", "מנהל מפעל", order.getId().toString()
        );

        return fileUrl;
    }

    private Order requireOrderInStatus(UUID orderId, OrderStatus required, String message) {
        Order order = orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
        if (order.getStatus() != required) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, message);
        }
        return order;
    }
}
