package com.kostone.marble.service.financial;

import com.kostone.marble.domain.financial.FinancialLedger;
import com.kostone.marble.domain.financial.FinancialLedgerRepository;
import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.dto.financial.CreatePaymentRequest;
import com.kostone.marble.dto.financial.LedgerEntryResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FinancialLedgerService {

    private final FinancialLedgerRepository ledgerRepository;
    private final OrderRepository orderRepository;

    /** Returns all ledger entries for an order. */
    @Transactional(readOnly = true)
    public List<LedgerEntryResponse> listByOrder(UUID orderId) {
        requireActiveOrder(orderId);
        return ledgerRepository.findByOrderId(orderId)
                .stream().map(LedgerEntryResponse::from).toList();
    }

    /**
     * Creates a new financial_ledger entry for the given order.
     * Amount is validated as BigDecimal before reaching this method
     * (see CreatePaymentRequest + JacksonConfig).
     */
    @Transactional
    public LedgerEntryResponse createEntry(UUID orderId, CreatePaymentRequest req) {
        Order order = requireActiveOrder(orderId);

        FinancialLedger entry = new FinancialLedger();
        entry.setOrder(order);
        entry.setAmountAllocated(req.amountAllocated());
        entry.setMilestoneTier(req.milestoneTier());
        entry.setCleared(false);

        return LedgerEntryResponse.from(ledgerRepository.save(entry));
    }

    /**
     * Marks a ledger entry as cleared (payment confirmed).
     * The orderId path variable scopes the lookup so callers cannot
     * clear entries belonging to other orders.
     */
    @Transactional
    public LedgerEntryResponse clearEntry(UUID orderId, UUID ledgerId) {
        requireActiveOrder(orderId);

        FinancialLedger entry = ledgerRepository.findById(ledgerId)
                .filter(l -> l.getOrder().getId().equals(orderId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ledger entry not found"));

        if (entry.isCleared()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "תשלום זה כבר סומן כמאושר");
        }

        entry.setCleared(true);
        entry.setClearedAt(OffsetDateTime.now());
        return LedgerEntryResponse.from(ledgerRepository.save(entry));
    }

    private Order requireActiveOrder(UUID orderId) {
        return orderRepository.findByIdAndDeletedAtIsNull(orderId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Order not found"));
    }
}
