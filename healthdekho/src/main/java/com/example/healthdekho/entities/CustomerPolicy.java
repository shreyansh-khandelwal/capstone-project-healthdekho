package com.example.healthdekho.entities;

import java.math.BigDecimal;
import org.hibernate.annotations.CreationTimestamp;
import java.time.LocalDateTime;
import java.time.LocalDate;

import com.example.healthdekho.core.enums.PolicyStatus;
import com.example.healthdekho.core.enums.PremiumFrequency;

import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "sk_customer_policy")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CustomerPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long policyId;

    @Column(nullable = false, unique = true)
    private String policyNumber;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private InsuranceProduct product;

    private LocalDate startDate;

    private LocalDate maturityDate;

    @Enumerated(EnumType.STRING)
    private PremiumFrequency premiumFrequency;

    private BigDecimal premiumAmount;

    private BigDecimal sumInsured;

    private BigDecimal totalPremiumPayable;

    @Enumerated(EnumType.STRING)
    private PolicyStatus status;

    
    @CreationTimestamp
    private LocalDateTime createdAt;

   

    public CustomerPolicy(Customer owner, String string, String string2, String string3, int i, LocalDate of,
            LocalDate of2, String string4, BigDecimal bigDecimal, BigDecimal bigDecimal2, String string5) {
        this.customer = owner;
        this.policyNumber = string;
        this.product = new InsuranceProduct(string2, string3, i);
        this.startDate = of;
        this.maturityDate = of2;
        this.premiumFrequency = PremiumFrequency.valueOf(string4);
        this.premiumAmount = bigDecimal;
        this.sumInsured = bigDecimal2;
        this.status = PolicyStatus.valueOf(string5);
    }
}
