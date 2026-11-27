package com.example.healthdekho.DTO;


import java.math.BigDecimal;

public record RecommendationResponse(

        String productCode,

        String policyName,

        String policyType,

        Integer policyTerm,

        BigDecimal sumInsured,

        String premiumFrequency,

        BigDecimal premiumAmount,

        String recommendationReason,

        BigDecimal suitability,

        Long productId

) {
}
