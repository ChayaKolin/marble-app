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
                "cooktopBaseFee", m.getCooktopBaseFee(),
                "notes", m.getNotes() != null ? m.getNotes() : ""
            )).toList()
        );
    }

    @PostMapping
    @PreAuthorize("hasAuthority('ROLE_SUPER_ADMIN_OWNER')")
    public ResponseEntity<Map<String, Object>> create(@PathVariable UUID orderId,
                                                       @RequestBody Map<String, Object> body) {
        Order order = orderRepo.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));

        String marbleModelCode = (String) body.get("marbleModelCode");
        if (marbleModelCode == null || marbleModelCode.isBlank())
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "יש להזין סוג / קוד שיש");

        BigDecimal squareMeters = parseDecimal(body.get("squareMeters"), "שטח (מ\"ר)", true);

        MaterialSpecification spec = new MaterialSpecification();
        spec.setOrder(order);
        spec.setMarbleModelCode(marbleModelCode);
        spec.setFinishType((String) body.get("finishType"));
        spec.setSquareMeters(squareMeters);
        spec.setCounterEdgeDetailing((String) body.getOrDefault("counterEdgeDetailing", null));
        spec.setWaterEdgeRequired(Boolean.TRUE.equals(body.get("waterEdgeRequired")));
        if (body.get("cooktopBaseFee") != null)
            spec.setCooktopBaseFee(parseDecimal(body.get("cooktopBaseFee"), "עלות כיריים", false));
        spec.setNotes((String) body.getOrDefault("notes", null));

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

    /** @param mustBePositive if true, zero/negative values are rejected; otherwise zero is allowed (e.g. "no cooktop fee"). */
    private BigDecimal parseDecimal(Object value, String fieldLabel, boolean mustBePositive) {
        if (value == null)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "יש להזין " + fieldLabel);
        BigDecimal parsed;
        try {
            parsed = new BigDecimal(value.toString().trim());
        } catch (NumberFormatException e) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldLabel + " חייב להיות מספר תקין");
        }
        if (mustBePositive ? parsed.signum() <= 0 : parsed.signum() < 0)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    fieldLabel + (mustBePositive ? " חייב להיות גדול מ-0" : " לא יכול להיות שלילי"));
        return parsed;
    }
}
