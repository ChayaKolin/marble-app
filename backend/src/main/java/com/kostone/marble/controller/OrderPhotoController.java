package com.kostone.marble.controller;

import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderPhoto;
import com.kostone.marble.domain.order.OrderPhotoRepository;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.service.storage.FileStorageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/photos")
@RequiredArgsConstructor
public class OrderPhotoController {

    private final OrderPhotoRepository photoRepository;
    private final OrderRepository orderRepository;
    private final FileStorageService fileStorageService;

    @GetMapping
    @PreAuthorize("hasAnyRole('SUPER_ADMIN_OWNER','FACTORY_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> list(@PathVariable UUID orderId) {
        return ResponseEntity.ok(
            photoRepository.findByOrderIdOrderByUploadedAtAsc(orderId).stream()
                .map(p -> Map.<String,Object>of(
                    "id", p.getId(),
                    "fileUrl", p.getFileUrl(),
                    "label", p.getLabel() != null ? p.getLabel() : "",
                    "uploadedAt", p.getUploadedAt()
                )).toList()
        );
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<Map<String, Object>> upload(
            @PathVariable UUID orderId,
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "label", required = false) String label) {

        Order order = orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String url = fileStorageService.store(file, "photos/" + orderId);

        OrderPhoto photo = new OrderPhoto();
        photo.setOrder(order);
        photo.setFileUrl(url);
        photo.setLabel(label);
        photoRepository.save(photo);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("id", photo.getId(), "fileUrl", url, "label", label != null ? label : ""));
    }

    @DeleteMapping("/{photoId}")
    @PreAuthorize("hasRole('SUPER_ADMIN_OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID orderId, @PathVariable UUID photoId) {
        photoRepository.findById(photoId)
                .filter(p -> p.getOrder().getId().equals(orderId))
                .ifPresent(photoRepository::delete);
        return ResponseEntity.noContent().build();
    }
}
