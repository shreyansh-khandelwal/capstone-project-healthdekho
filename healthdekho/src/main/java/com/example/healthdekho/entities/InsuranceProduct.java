package com.example.healthdekho.entities;

import com.example.healthdekho.core.enums.PolicyType;
import com.example.healthdekho.core.enums.PremiumFrequency;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Entity
@Table(name = "sk_insurance_product")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InsuranceProduct {

    public InsuranceProduct(String string2, String string3, int i) {
        this.productCode = string2;
        this.policyName = string3;
        this.termMonths = i;
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long productId;

    @Column(nullable = false, unique = true)
    @NotBlank
    private String productCode;

    @Column(nullable = false)
    @NotBlank
    private String policyName;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PolicyType policyType;

    @Column(nullable = false)
    private Integer termMonths;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private PremiumFrequency premiumFrequency;

    @Column(nullable = false)
    @Positive 
    @DecimalMin("0.0")
    private BigDecimal premiumAmount;

    @Column(nullable = false)
    @Positive
    private BigDecimal sumInsured;

    @Column(nullable = false)
    @Min(0) 
    @Positive
    private Integer minEntryAge;

    @Column(nullable = false)
    @Min(0)
    @Positive
    private Integer maxEntryAge;

    @Column(nullable = false)
    private Boolean active;
}