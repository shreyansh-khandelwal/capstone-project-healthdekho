package com.example.healthdekho.controllers;

import com.example.healthdekho.DTO.AvailableProductResponse;
import com.example.healthdekho.services.ProductDiscoveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductDiscoveryService productDiscoveryService;

    @GetMapping("/available")
    public ResponseEntity<List<AvailableProductResponse>> getAvailableProducts(Authentication authentication, Pageable pageable) {
        if (authentication == null || !authentication.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        System.out.println("Fetching available products for customer: " + authentication.getName());
        List<AvailableProductResponse> availableProducts =
                productDiscoveryService.getAvailableProductsForCustomer(authentication.getName(),pageable);
        return ResponseEntity.ok(availableProducts);
    }
}