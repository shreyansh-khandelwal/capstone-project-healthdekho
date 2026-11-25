package com.example.healthdekho.entities;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "policy")
@Getter
@NoArgsConstructor
public class Policy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "policy_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @Column(name = "policy_identifier", nullable = false, unique = true)
    private String policyIdentifier;

    @Column(name = "product_name", nullable = false)
    private String productName;

    @Column(name = "policy_type", nullable = false)
    private String policyType;

    @Column(name = "term_months", nullable = false)
    private int termMonths;

    @Column(name = "start_date", nullable = false)
    private LocalDate startDate;

    @Column(name = "maturity_date", nullable = false)
    private LocalDate maturityDate;

    @Column(name = "premium_frequency", nullable = false)
    private String premiumFrequency;

    @Column(name = "premium_amount", nullable = false)
    private BigDecimal premiumAmount;

    @Column(name = "sum_insured", nullable = false)
    private BigDecimal sumInsured;

    @Column(nullable = false)
    private String status;

    public Policy(Customer customer, String policyIdentifier, String productName, String policyType,
                  int termMonths, LocalDate startDate, LocalDate maturityDate,
                  String premiumFrequency, BigDecimal premiumAmount, BigDecimal sumInsured,
                  String status) {
        this.customer = customer;
        this.policyIdentifier = policyIdentifier;
        this.productName = productName;
        this.policyType = policyType;
        this.termMonths = termMonths;
        this.startDate = startDate;
        this.maturityDate = maturityDate;
        this.premiumFrequency = premiumFrequency;
        this.premiumAmount = premiumAmount;
        this.sumInsured = sumInsured;
        this.status = status;
    }
}
