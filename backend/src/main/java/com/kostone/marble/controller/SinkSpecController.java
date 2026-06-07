package com.kostone.marble.controller;

import com.kostone.marble.domain.order.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/sinks")
@RequiredArgsConstructor
public class SinkSpecController {

    private final SinkSpecificationRepository repo;
    private final OrderRepository orderRepo;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN_OWNER','ROLE_FACTORY_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> list(@PathVariable UUID orderId) {
        return ResponseEntity.ok(
            repo.findByOrderId(orderId).stream().map(s -> Map.<String,Object>of(
                "id", s.getId(),
                "brand", s.getBrand(),
                "modelName", s.getModelName(),
                "widthMm", s.getWidthMm(),
                "heightMm", s.getHeightMm(),
                "depthMm", s.getDepthMm(),
                "color", s.getColor(),
                "mountingStyle", s.getMountingStyle()
            )).toList()
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<Map<String, Object>> create(@PathVariable UUID orderId,
                                                       @RequestBody Map<String, Object> body) {
        Order order = orderRepo.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        SinkSpecification sink = new SinkSpecification();
        sink.setOrder(order);
        sink.setBrand(str(body, "brand", "לא ידוע"));
        sink.setModelName(str(body, "modelName", "לא ידוע"));
        sink.setWidthMm(intVal(body, "widthMm", 0));
        sink.setHeightMm(intVal(body, "heightMm", 0));
        sink.setDepthMm(intVal(body, "depthMm", 0));
        sink.setColor(str(body, "color", ""));
        sink.setMountingStyle(str(body, "mountingStyle", "UNDERMOUNT"));

        repo.save(sink);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", sink.getId()));
    }

    @DeleteMapping("/{sinkId}")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID orderId, @PathVariable UUID sinkId) {
        repo.findById(sinkId).filter(s -> s.getOrder().getId().equals(orderId))
                .ifPresent(repo::delete);
        return ResponseEntity.noContent().build();
    }

    private String str(Map<String, Object> m, String k, String def) {
        Object v = m.get(k); return v != null ? v.toString() : def;
    }
    private int intVal(Map<String, Object> m, String k, int def) {
        Object v = m.get(k); try { return v != null ? Integer.parseInt(v.toString()) : def; } catch (Exception e) { return def; }
    }
}
