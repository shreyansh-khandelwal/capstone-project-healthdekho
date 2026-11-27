package com.example.healthdekho.controllers;
import com.example.healthdekho.DTO.RecommendationRequest;
import com.example.healthdekho.DTO.RecommendationResponse;
import com.example.healthdekho.services.RecommendationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.List;


@RestController
@RequiredArgsConstructor 
@RequestMapping("/api/v1/recommendations")
public class RecommendationController {

    private final RecommendationService recommendationService;

    @PostMapping("/generate")
    public ResponseEntity<List<RecommendationResponse>>
    generateRecommendations(

            Authentication authentication,

            @RequestBody RecommendationRequest request) {

        return ResponseEntity.ok(
                recommendationService.generateRecommendations(
                        authentication.getName(),
                        request));
    }
}
