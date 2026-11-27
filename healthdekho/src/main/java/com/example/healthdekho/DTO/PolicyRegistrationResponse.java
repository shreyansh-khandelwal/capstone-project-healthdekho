package com.example.healthdekho.DTO;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
public class PolicyRegistrationResponse {

    private String policyNumber;
    private String policyName;
    private LocalDate startDate;
    private LocalDate maturityDate;
    private BigDecimal premiumAmount;
    private BigDecimal sumInsured;
    private String status;
}