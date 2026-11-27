package com.example.healthdekho.DTO;

import java.math.BigDecimal;

public record AiProductRecommendation(

        String productCode,

        String recommendationReason,

        BigDecimal suitability

) {
}
