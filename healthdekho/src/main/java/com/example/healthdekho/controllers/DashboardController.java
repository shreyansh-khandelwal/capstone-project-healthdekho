package com.example.healthdekho.controllers;

import com.example.healthdekho.DTO.PolicyPageResponse;
import com.example.healthdekho.services.PolicyService;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.example.healthdekho.services.AuthService;

import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/v1")
public class DashboardController {

    private final AuthService authService;
    private final PolicyService policyService;

    public DashboardController(AuthService authService, PolicyService policyService) {
        this.authService = authService;
        this.policyService = policyService;
    }

    @GetMapping("/dashboard")
    public PolicyPageResponse dashboard(
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (page < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Page must not be negative");
        }
        if (size < 1 || size > 100) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Size must be between 1 and 100");
        }
        return authService.authenticatedCustomer(authentication)
                .map(customer -> policyService.dashboard(customer, page, size))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
    }
}
