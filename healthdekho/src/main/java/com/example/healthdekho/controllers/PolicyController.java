package com.example.healthdekho.controllers;

import com.example.healthdekho.DTO.PolicyRegistrationRequest;
import com.example.healthdekho.DTO.PolicyRegistrationResponse;
import com.example.healthdekho.DTO.PolicyResponse;
import org.springframework.http.ResponseEntity;
import javax.validation.Valid;
import com.example.healthdekho.services.AuthService;
import com.example.healthdekho.services.PolicyRegistrationService;
import com.example.healthdekho.services.PolicyService;
import com.example.healthdekho.services.PolicyService.PolicyAccessDeniedException;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/v1/policies")
public class PolicyController {

    private final AuthService authService;
    private final PolicyService policyService;
    private final PolicyRegistrationService policyRegistrationService;

    public PolicyController(AuthService authService, PolicyService policyService, PolicyRegistrationService policyRegistrationService) {
        this.authService = authService;
        this.policyService = policyService;
        this.policyRegistrationService = policyRegistrationService;
    }

    @GetMapping("/{policyIdentifier}")
    public PolicyResponse policy(Authentication authentication,
                                 @PathVariable String policyIdentifier) {
        var customer = authService.authenticatedCustomer(authentication)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED));
        try {
            return PolicyResponse.from(policyService.ownedPolicy(customer, policyIdentifier));
        } catch (PolicyAccessDeniedException exception) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Policy access denied", exception);
        }
    }



   

    @PostMapping("/register")
    public ResponseEntity<PolicyRegistrationResponse> registerPolicy(
            Authentication authentication,
            @RequestBody @Valid PolicyRegistrationRequest request) {

        PolicyRegistrationResponse response =
                policyRegistrationService.registerPolicy(
                        authentication.getName(),
                        request);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(response);
    }
}
