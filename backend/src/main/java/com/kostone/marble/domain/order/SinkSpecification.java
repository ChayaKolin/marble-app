package com.kostone.marble.domain.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.UUID;

@Entity
@Table(name = "sink_specifications")
@Getter @Setter @NoArgsConstructor
public class SinkSpecification {

    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Column(name = "brand", nullable = false, length = 100)
    private String brand;

    @Column(name = "model_name", nullable = false, length = 100)
    private String modelName;

    @Column(name = "width_mm", nullable = false)
    private int widthMm;

    @Column(name = "height_mm", nullable = false)
    private int heightMm;

    @Column(name = "depth_mm", nullable = false)
    private int depthMm;

    @Column(name = "color", nullable = false, length = 50)
    private String color;

    @Column(name = "mounting_style", nullable = false, length = 20)
    private String mountingStyle = "UNDERMOUNT";
}
