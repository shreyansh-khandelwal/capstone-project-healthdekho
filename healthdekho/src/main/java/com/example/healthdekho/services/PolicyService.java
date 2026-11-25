package com.example.healthdekho.services;

import com.example.healthdekho.DTO.PolicyPageResponse;
import com.example.healthdekho.DTO.PolicyResponse;
import com.example.healthdekho.entities.Customer;
import com.example.healthdekho.entities.Policy;
import com.example.healthdekho.repositories.PolicyRepository;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional(readOnly = true)
public class PolicyService {

    private final PolicyRepository policyRepository;

    public PolicyService(PolicyRepository policyRepository) {
        this.policyRepository = policyRepository;
    }

    public PolicyPageResponse dashboard(Customer customer, int page, int size) {
        Page<Policy> policies = policyRepository.findByCustomerId(
                customer.getId(),
                PageRequest.of(page, size, Sort.by("policyIdentifier").ascending()));
        List<PolicyResponse> responses = policies.getContent().stream()
                .map(PolicyResponse::from)
                .toList();
        return new PolicyPageResponse(
                List.copyOf(responses),
                policies.getNumber(),
                policies.getSize(),
                policies.getTotalElements(),
                policies.getTotalPages(),
                policies.isFirst(),
                policies.isLast());
    }

    public Policy ownedPolicy(Customer customer, String policyIdentifier) {
        Policy policy = policyRepository.findByPolicyIdentifier(policyIdentifier)
                .orElseThrow(PolicyAccessDeniedException::new);
        if (!policy.getCustomer().getId().equals(customer.getId())) {
            throw new PolicyAccessDeniedException();
        }
        return policy;
    }

    public static class PolicyAccessDeniedException extends RuntimeException {
    }
}
