package com.example.healthdekho.repositories;

import com.example.healthdekho.entities.AiRecommendationItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AiRecommendationItemRepository
        extends JpaRepository<AiRecommendationItem, Long> {

    List<AiRecommendationItem>
    findByRecommendationRequestRecommendationRequestIdOrderByRankOrderAsc(
            Long recommendationRequestId
    );
}