package com.kostone.marble.domain.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "material_specifications")
@Getter @Setter @NoArgsConstructor
public class MaterialSpecification {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "marble_model_code", nullable = false, length = 100)
    private String marbleModelCode;

    @Column(name = "finish_type", nullable = false, length = 50)
    private String finishType;

    @Column(name = "square_meters", nullable = false, precision = 6, scale = 2)
    private BigDecimal squareMeters;

    @Column(name = "counter_edge_detailing", length = 255)
    private String counterEdgeDetailing;

    @Column(name = "water_edge_required", nullable = false)
    private boolean waterEdgeRequired = false;

    @Column(name = "cooktop_base_fee", nullable = false, precision = 6, scale = 2)
    private BigDecimal cooktopBaseFee = new BigDecimal("200.00");
}
