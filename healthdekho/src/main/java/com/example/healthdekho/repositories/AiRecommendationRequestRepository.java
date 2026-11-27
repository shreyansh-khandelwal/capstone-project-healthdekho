package com.example.healthdekho.repositories;

import com.example.healthdekho.entities.AiRecommendationRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiRecommendationRequestRepository
        extends JpaRepository<AiRecommendationRequest, Long> {

    List<AiRecommendationRequest>
    findByCustomerCustomerIdOrderByRequestedAtDesc(
            Long customerId
    );
}