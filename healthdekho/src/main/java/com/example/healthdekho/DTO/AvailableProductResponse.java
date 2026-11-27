package com.example.healthdekho.DTO;

import com.example.healthdekho.core.enums.PolicyType;
import com.example.healthdekho.core.enums.PremiumFrequency;
import com.example.healthdekho.entities.InsuranceProduct;

import java.math.BigDecimal;

public record AvailableProductResponse(
        Long productId,
        String productCode,
        String policyName,
        PolicyType policyType,
        Integer termMonths,
        BigDecimal sumInsured,
        PremiumFrequency premiumFrequency,
        BigDecimal premiumAmount,
        Integer minEntryAge,
        Integer maxEntryAge
) {
    public static AvailableProductResponse fromEntity(InsuranceProduct product) {
        return new AvailableProductResponse(
                product.getProductId(),
                product.getProductCode(),
                product.getPolicyName(),
                product.getPolicyType(),
                product.getTermMonths(),
                product.getSumInsured(),
                product.getPremiumFrequency(),
                product.getPremiumAmount(),
                product.getMinEntryAge(),
                product.getMaxEntryAge()
        );
    }
}