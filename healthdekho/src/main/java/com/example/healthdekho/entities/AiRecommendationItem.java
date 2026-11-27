package com.example.healthdekho.entities;
import java.math.BigDecimal;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import jakarta.persistence.Id;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
@Entity
@Table(
    name = "sk_ai_recommendation_item",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {
                "recommendation_request_id",
                "product_id"
            }
        )
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AiRecommendationItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long recommendationItemId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recommendation_request_id")
    private AiRecommendationRequest recommendationRequest;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "product_id")
    private InsuranceProduct product;

    private Integer rankOrder;

    @Column(name = "recommendation_reason", columnDefinition = "TEXT")
    private String recommendationReason;

    private BigDecimal suitability;

    private Boolean selectedForRegistration;
}
