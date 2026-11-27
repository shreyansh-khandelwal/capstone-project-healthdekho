package com.example.healthdekho.DTO;

import com.example.healthdekho.core.enums.PolicyStatus;
import com.example.healthdekho.core.enums.PolicyType;
import com.example.healthdekho.core.enums.PremiumFrequency;
import com.example.healthdekho.entities.CustomerPolicy;

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

    public PolicyResponse(
            String policyNumber,
            String policyName,
            PolicyType policyType,
            Integer termMonths,
            LocalDate startDate,
            LocalDate maturityDate,
            PremiumFrequency premiumFrequency,
            BigDecimal premiumAmount,
            BigDecimal sumInsured,
            PolicyStatus status) {
        this(
                policyNumber,
                policyName,
                policyType != null ? policyType.name() : null,
                termMonths != null ? termMonths : 0,
                startDate,
                maturityDate,
                premiumFrequency != null ? premiumFrequency.name() : null,
                premiumAmount,
                sumInsured,
                status != null ? status.name() : null);
    }

    public static PolicyResponse from(CustomerPolicy policy) {
        if (policy == null) {
            return null;
        }
        var product = policy.getProduct();
        return new PolicyResponse(
                policy.getPolicyNumber(),
                product != null ? product.getPolicyName() : null,
                product != null ? product.getPolicyType() : null,
                product != null ? product.getTermMonths() : null,
                policy.getStartDate(),
                policy.getMaturityDate(),
                policy.getPremiumFrequency(),
                policy.getPremiumAmount(),
                policy.getSumInsured(),
                policy.getStatus());
    }
}