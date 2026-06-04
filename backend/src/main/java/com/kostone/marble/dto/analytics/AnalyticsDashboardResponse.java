package com.kostone.marble.dto.analytics;

import java.math.BigDecimal;
import java.util.List;

public record AnalyticsDashboardResponse(
        // Header KPIs
        BigDecimal totalRevenueThisMonth,
        BigDecimal totalCollectedThisMonth,
        BigDecimal totalReceivablesPipeline,
        int openProductionBacklog,
        // Monthly chart (current year)
        List<MonthlyRevenue> monthlyRevenue,
        // Material pie
        List<MaterialVolume> materialDistribution,
        // SLA compliance
        List<SlaComplianceEntry> slaCompliance,
        // Installer performance
        List<InstallerPerformance> installerPerformance
) {
    public record MonthlyRevenue(int month, String monthHe, BigDecimal grossAmount, BigDecimal collected) {}
    public record MaterialVolume(String modelCode, double squareMeters) {}
    public record SlaComplianceEntry(String orderRef, String customerName, String slaDealine, boolean metSla) {}
    public record InstallerPerformance(String installerName, int completedJobs, int jobsWithNotes) {}
}
