package com.example.healthdekho.services;

import com.example.healthdekho.DTO.AvailableProductResponse;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import com.example.healthdekho.entities.Customer;
import com.example.healthdekho.entities.InsuranceProduct;
import com.example.healthdekho.entities.CustomerPolicy;
import com.example.healthdekho.repositories.CustomerRepository;
import com.example.healthdekho.repositories.InsuranceProductRepository;
import com.example.healthdekho.repositories.PolicyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProductDiscoveryService {

    private final CustomerRepository customerRepository;
    private final InsuranceProductRepository insuranceProductRepository;
    private final PolicyRepository policyRepository;

    public List<AvailableProductResponse> getAvailableProductsForCustomer(String customerEmail,Pageable pageable) {
        Customer customer = customerRepository.findByEmailIgnoreCase(customerEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Authenticated customer profile not found"));

        Page<InsuranceProduct> activeProducts =
                insuranceProductRepository.findByActiveTrueOrderByPolicyNameAsc(pageable);

        Page<CustomerPolicy> registeredPolicies =
                policyRepository.findByCustomerCustomerId(customer.getCustomerId(), pageable);

        Set<String> registeredPolicyNames = registeredPolicies.stream()
                .map(CustomerPolicy::getProduct)
                .map(InsuranceProduct::getPolicyName)
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());

        return activeProducts.stream()
                .filter(product -> !isAlreadyRegistered(product, registeredPolicyNames))
                .map(AvailableProductResponse::fromEntity)
                .toList();
    }

    private boolean isAlreadyRegistered(InsuranceProduct product, Set<String> registeredPolicyNames) {
        if (product.getPolicyName() == null) {
            return false;
        }
        String normalizedName = product.getPolicyName().trim().toLowerCase(Locale.ROOT);
        return registeredPolicyNames.contains(normalizedName);
    }
}