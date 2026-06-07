package com.kostone.marble.controller;

import com.kostone.marble.domain.order.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/orders/{orderId}/materials")
@RequiredArgsConstructor
public class MaterialSpecController {

    private final MaterialSpecificationRepository repo;
    private final OrderRepository orderRepo;

    @GetMapping
    @PreAuthorize("hasAnyAuthority('ROLE_SUPER_ADMIN_OWNER','ROLE_FACTORY_MANAGER')")
    public ResponseEntity<List<Map<String, Object>>> list(@PathVariable UUID orderId) {
        return ResponseEntity.ok(
            repo.findByOrderId(orderId).stream().map(m -> Map.<String,Object>of(
                "id", m.getId(),
                "marbleModelCode", m.getMarbleModelCode(),
                "finishType", m.getFinishType(),
                "squareMeters", m.getSquareMeters(),
                "counterEdgeDetailing", m.getCounterEdgeDetailing() != null ? m.getCounterEdgeDetailing() : "",
                "waterEdgeRequired", m.isWaterEdgeRequired(),
                "cooktopBaseFee", m.getCooktopBaseFee()
            )).toList()
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<Map<String, Object>> create(@PathVariable UUID orderId,
                                                       @RequestBody Map<String, Object> body) {
        Order order = orderRepo.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        MaterialSpecification spec = new MaterialSpecification();
        spec.setOrder(order);
        spec.setMarbleModelCode((String) body.get("marbleModelCode"));
        spec.setFinishType((String) body.get("finishType"));
        spec.setSquareMeters(new BigDecimal(body.get("squareMeters").toString()));
        spec.setCounterEdgeDetailing((String) body.getOrDefault("counterEdgeDetailing", null));
        spec.setWaterEdgeRequired(Boolean.TRUE.equals(body.get("waterEdgeRequired")));
        if (body.get("cooktopBaseFee") != null)
            spec.setCooktopBaseFee(new BigDecimal(body.get("cooktopBaseFee").toString()));

        repo.save(spec);
        return ResponseEntity.status(HttpStatus.CREATED).body(Map.of("id", spec.getId()));
    }

    @DeleteMapping("/{specId}")
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<Void> delete(@PathVariable UUID orderId, @PathVariable UUID specId) {
        repo.findById(specId).filter(s -> s.getOrder().getId().equals(orderId))
                .ifPresent(repo::delete);
        return ResponseEntity.noContent().build();
    }
}
