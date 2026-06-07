package com.kostone.marble.domain.signature;

import com.kostone.marble.domain.order.Order;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "digital_signatures")
@Getter
@Setter
@NoArgsConstructor
public class DigitalSignature {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @Enumerated(EnumType.STRING)
    @JdbcTypeCode(SqlTypes.NAMED_ENUM)
    @Column(name = "category", nullable = false)
    private SignatureCategory category;

    @Column(name = "signature_vector_data", nullable = false, columnDefinition = "TEXT")
    private String signatureVectorData;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "signed_at", nullable = false, updatable = false)
    private OffsetDateTime signedAt = OffsetDateTime.now();
}
