package com.example.healthdekho.entities;
import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Enumerated;
import jakarta.persistence.EnumType;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import com.example.healthdekho.core.enums.PaymentStatus;
@Entity
@Table(
    name = "sk_premium_installment",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "policy_id",
                "installment_number"
            }
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PremiumInstallment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long installmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "policy_id")
    private CustomerPolicy policy;

    private Integer installmentNumber;

    private LocalDate dueDate;

    private LocalDate gracePeriodEndDate;

    private BigDecimal scheduledAmount;

    private BigDecimal paidAmount;

    @Enumerated(EnumType.STRING)
    private PaymentStatus paymentStatus;
}
