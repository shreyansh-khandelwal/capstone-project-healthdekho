package com.example.healthdekho.DTO;

import com.example.healthdekho.entities.Policy;
import java.math.BigDecimal;
import java.time.LocalDate;

public record PolicyResponse(
        String policyIdentifier,
        String productName,
        String policyType,
        int termMonths,
        LocalDate startDate,
        LocalDate maturityDate,
        String premiumFrequency,
        BigDecimal premiumAmount,
        BigDecimal sumInsured,
        String status) {

    public static PolicyResponse from(Policy policy) {
        return new PolicyResponse(
                policy.getPolicyIdentifier(),
                policy.getProductName(),
                policy.getPolicyType(),
                policy.getTermMonths(),
                policy.getStartDate(),
                policy.getMaturityDate(),
                policy.getPremiumFrequency(),
                policy.getPremiumAmount(),
                policy.getSumInsured(),
                policy.getStatus());
    }
}
