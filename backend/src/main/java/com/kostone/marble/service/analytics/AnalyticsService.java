package com.kostone.marble.service.analytics;

import com.kostone.marble.domain.financial.FinancialLedgerRepository;
import com.kostone.marble.domain.logistics.LogisticsAssignmentRepository;
import com.kostone.marble.domain.order.Order;
import com.kostone.marble.domain.order.OrderRepository;
import com.kostone.marble.domain.order.OrderStatus;
import com.kostone.marble.dto.analytics.AnalyticsDashboardResponse;
import com.kostone.marble.dto.analytics.AnalyticsDashboardResponse.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Month;
import java.time.OffsetDateTime;
import java.time.format.TextStyle;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private final OrderRepository orderRepository;
    private final FinancialLedgerRepository ledgerRepository;
    private final LogisticsAssignmentRepository assignmentRepository;

    private static final List<String> MONTHS_HE = List.of(
            "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
            "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
    );

    @Transactional(readOnly = true)
    public AnalyticsDashboardResponse buildDashboard() {
        List<Order> allActive = orderRepository.findAllActive();
        OffsetDateTime now = OffsetDateTime.now();
        int currentMonth = now.getMonthValue();
        int currentYear = now.getYear();

        // ── KPIs ──────────────────────────────────────────────────────────
        BigDecimal totalGrossThisMonth = allActive.stream()
                .filter(o -> o.getCreatedAt().getYear() == currentYear
                        && o.getCreatedAt().getMonthValue() == currentMonth)
                .map(Order::getTotalGrossAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal collected = ledgerRepository.findAll().stream()
                .filter(l -> l.isCleared()
                        && l.getClearedAt() != null
                        && l.getClearedAt().getYear() == currentYear
                        && l.getClearedAt().getMonthValue() == currentMonth)
                .map(l -> l.getAmountAllocated())
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal pipeline = allActive.stream()
                .filter(o -> o.getStatus() != OrderStatus.COMPLETED
                        && o.getStatus() != OrderStatus.ARCHIVED)
                .map(Order::getTotalGrossAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long backlog = allActive.stream()
                .filter(o -> o.getStatus() == OrderStatus.PRODUCTION)
                .count();

        // ── Monthly revenue (current year) ────────────────────────────────
        Map<Integer, BigDecimal> grossByMonth = allActive.stream()
                .filter(o -> o.getCreatedAt().getYear() == currentYear)
                .collect(Collectors.groupingBy(
                        o -> o.getCreatedAt().getMonthValue(),
                        Collectors.reducing(BigDecimal.ZERO, Order::getTotalGrossAmount, BigDecimal::add)));

        Map<Integer, BigDecimal> collectedByMonth = ledgerRepository.findAll().stream()
                .filter(l -> l.isCleared() && l.getClearedAt() != null
                        && l.getClearedAt().getYear() == currentYear)
                .collect(Collectors.groupingBy(
                        l -> l.getClearedAt().getMonthValue(),
                        Collectors.reducing(BigDecimal.ZERO, l -> l.getAmountAllocated(), BigDecimal::add)));

        List<MonthlyRevenue> monthlyRevenue = new ArrayList<>();
        for (int m = 1; m <= currentMonth; m++) {
            monthlyRevenue.add(new MonthlyRevenue(
                    m, MONTHS_HE.get(m - 1),
                    grossByMonth.getOrDefault(m, BigDecimal.ZERO),
                    collectedByMonth.getOrDefault(m, BigDecimal.ZERO)));
        }

        // ── Material distribution ─────────────────────────────────────────
        // Build from active orders' material specs (simplified — no join fetch here)
        List<MaterialVolume> materialDist = List.of(); // populated via dedicated query in controller

        // ── SLA compliance ────────────────────────────────────────────────
        List<SlaComplianceEntry> slaEntries = allActive.stream()
                .filter(o -> o.getStatus() == OrderStatus.PRODUCTION && o.getFactorySlaDeadline() != null)
                .map(o -> new SlaComplianceEntry(
                        o.getId().toString().substring(0, 8),
                        o.getCustomer().getFullName(),
                        o.getFactorySlaDeadline().toLocalDate().toString(),
                        o.getFactorySlaDeadline().isAfter(now)))
                .toList();

        // ── Installer performance ─────────────────────────────────────────
        List<InstallerPerformance> installerPerf = assignmentRepository.findAll().stream()
                .collect(Collectors.groupingBy(a -> a.getInstallerUser().getFullName()))
                .entrySet().stream()
                .map(e -> {
                    var assignments = e.getValue();
                    int completed = (int) assignments.stream().filter(a -> a.isCompleted()).count();
                    int withNotes = (int) assignments.stream()
                            .filter(a -> a.getInstallerNotes() != null && !a.getInstallerNotes().isBlank())
                            .count();
                    return new InstallerPerformance(e.getKey(), completed, withNotes);
                })
                .sorted(Comparator.comparingInt(InstallerPerformance::completedJobs).reversed())
                .toList();

        return new AnalyticsDashboardResponse(
                totalGrossThisMonth, collected, pipeline, (int) backlog,
                monthlyRevenue, materialDist, slaEntries, installerPerf);
    }
}
