package com.example.healthdekho.DTO;

import java.time.LocalDate;

public record RecommendationRequest(

        LocalDate dateOfBirth,

        String insuranceGoals,

        Integer preferredTerm,

        String preferredPolicyType

) {
}