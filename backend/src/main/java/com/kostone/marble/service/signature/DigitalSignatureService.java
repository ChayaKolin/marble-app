package com.kostone.marble.service.signature;

import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.signature.DigitalSignature;
import com.kostone.marble.domain.signature.DigitalSignatureRepository;
import com.kostone.marble.domain.signature.SignatureCategory;
import com.kostone.marble.domain.user.UserRole;
import com.kostone.marble.dto.signature.CreateSignatureRequest;
import com.kostone.marble.dto.signature.SignatureResponse;
import com.kostone.marble.security.MarbleUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class DigitalSignatureService {

    private final DigitalSignatureRepository signatureRepository;
    private final OrderRepository orderRepository;

    @Transactional(readOnly = true)
    public List<SignatureResponse> listByOrder(UUID orderId) {
        return signatureRepository.findByOrderId(orderId)
                .stream().map(SignatureResponse::from).toList();
    }

    /**
     * Creates a digital signature record for an order.
     *
     * Authorization rules enforced here (not just at controller level):
     * - CUSTOMER: may only sign PRE_MEASUREMENT_DISCLAIMER or SLAB_LAYOUT_APPROVAL
     *             on their own orders (JWT sub == order.customer_id).
     * - INSTALLER: may only submit FINAL_POST_INSTALLATION (optional, no-gate).
     * - SUPER_ADMIN_OWNER: may create any signature category.
     */
    @Transactional
    public SignatureResponse create(UUID orderId, CreateSignatureRequest req, String ipAddress) {
        Order order = orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));

        MarbleUserDetails principal = currentPrincipal();

        assertCategoryAllowedForRole(principal.getRole(), req.category(), order);

        DigitalSignature sig = new DigitalSignature();
        sig.setOrder(order);
        sig.setCategory(req.category());
        sig.setSignatureVectorData(req.signatureData());
        sig.setIpAddress(ipAddress);
        sig.setNotes(req.notes());

        return SignatureResponse.from(signatureRepository.save(sig));
    }

    private void assertCategoryAllowedForRole(UserRole role, SignatureCategory category, Order order) {
        switch (role) {
            case CUSTOMER -> {
                // Verify the customer is signing their own order
                UUID customerId = currentPrincipal().getUserId();
                if (!order.getCustomer().getId().equals(customerId)) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN, "אין הרשאה לחתום על הזמנה זו");
                }
                // Customers may only sign these two categories
                if (category == SignatureCategory.FINAL_POST_INSTALLATION) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "חתימת לאחר התקנה מבוצעת על ידי המתקין");
                }
            }
            case INSTALLER -> {
                // Installers submit the mandatory post-installation signature only —
                // required by LogisticsService.markComplete() before the job can be
                // marked done and the remaining balance collected from the customer.
                if (category != SignatureCategory.FINAL_POST_INSTALLATION) {
                    throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                            "מתקינים יכולים להגיש חתימת סיום בלבד");
                }
            }
            case SUPER_ADMIN_OWNER -> { /* Full access — no restriction */ }
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "אין הרשאה");
        }
    }

    private MarbleUserDetails currentPrincipal() {
        return (MarbleUserDetails)
                SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }
}
